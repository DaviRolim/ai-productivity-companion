import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_PT } from '$lib/prompts';
import { ActionPlanSchema } from '$lib/schemas';
import { zodResponseFormat } from 'openai/helpers/zod';
import { createActionPlanWithObjectivesAndGoals } from '$lib/server/db/queries';
import { invalidateCache } from '$lib/server/cache';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request, locals }) => {
    console.log('Received chat request');
    
    if (!locals.user) {
        console.log('Authentication failed: No user found in locals');
        return json({
            success: false,
            error: 'Authentication required'
        }, { status: 401 });
    }
	try {
		const body = await request.json();
		const message = body.message?.trim();
		console.log('Received message:', message ? 'Valid message' : 'Empty message');

		// Get language from Accept-Language header
		const acceptLanguage = request.headers.get('accept-language') || '';
		const isPortuguese = acceptLanguage.toLowerCase().includes('pt');
		console.log('Language detection:', isPortuguese ? 'Portuguese' : 'English');

		if (!message) {
			console.log('Request rejected: Empty message');
			return json(
				{
					success: false,
					error: 'Message is required'
				},
				{ status: 400 }
			);
		}

		const userPrompt = `<user-input>
                            ${message}
                            </user-input>`;
		
		console.log('Making OpenAI API request...');
		const completion = await openai.beta.chat.completions.parse({
			messages: [
				{ role: 'system', content: isPortuguese ? SYSTEM_PROMPT_PT : SYSTEM_PROMPT },
				{ role: 'user', content: userPrompt }
			],
			model: 'gpt-4o-mini',
			response_format: zodResponseFormat(ActionPlanSchema, 'action_plan')
		});
		console.log('OpenAI API response received');

		const response = completion.choices[0]?.message;

		if (!response) {
			console.error('OpenAI response missing message content');
			throw new Error('No response from OpenAI');
		}

		// Handle potential refusal
		if (response.refusal) {
			console.log('AI refused to process request:', response.refusal);
			return json(
				{
					success: false,
					error: response.refusal
				},
				{ status: 400 }
			);
		}

		const parsedResponse = response.parsed;
		console.log('Response parsed successfully:', !!parsedResponse);

		if (!parsedResponse) {
            console.error('Parsed response is null or undefined');
            return json({
                success: false,
                error: 'No parsed response from OpenAI'
            }, { status: 500 });
        }

		// Save to database using centralized query
		try {
            console.log('Attempting to create action plan...');
            await createActionPlanWithObjectivesAndGoals(locals.user.id, parsedResponse.objectives);
            
            // Invalidate cache for the user
            invalidateCache(locals.user.id);
            
            console.log('Database operations completed successfully');

            // Return parsed response
            return json({
                success: true,
                response: parsedResponse
            });
        } catch (dbError) {
            console.error('Database operation failed:', dbError);
            if (dbError instanceof Error) {
                console.error('Database error details:', {
                    message: dbError.message,
                    stack: dbError.stack,
                    name: dbError.name
                });
            }
            return json(
                {
                    success: false,
                    error: 'Failed to save action plan to database'
                },
                { status: 500 }
            );
        }
	} catch (error) {
		console.error('Error in chat endpoint:', error);
		if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
		return json(
			{
				success: false,
				error: 'Failed to get response from AI'
			},
			{ status: 500 }
		);
	}
};
