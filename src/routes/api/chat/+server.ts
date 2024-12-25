import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_PT } from '$lib/prompts';
import { ActionPlanSchema } from '$lib/schemas';
import { zodResponseFormat } from 'openai/helpers/zod';
import { db } from '$lib/server/db';
import { actionPlan, objective, goal } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';

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

		// Save to database
		const now = new Date();
		console.log('Starting database operations...');
		
		try {
            console.log('Attempting to create action plan...');
            // Create action plan
            const newActionPlan = await db.insert(actionPlan).values({
                id: nanoid(),
                userId: locals.user.id,
                createdAt: now,
                updatedAt: now
            }).returning().get();
            console.log('Action plan created with ID:', newActionPlan.id);

            // Create objectives and goals
            console.log(`Processing ${parsedResponse.objectives.length} objectives...`);
            for (const obj of parsedResponse.objectives) {
                try {
                    console.log('Creating objective:', obj.name);
                    const newObjective = await db.insert(objective).values({
                        id: nanoid(),
                        actionPlanId: newActionPlan.id,
                        name: obj.name,
                        createdAt: now,
                        updatedAt: now
                    }).returning().get();
                    console.log('Created objective:', newObjective.id);

                    // Insert goals
                    console.log(`Adding goals for objective ${newObjective.id}`);
                    console.log(`- Short-term goals: ${obj.short_term.length}`);
                    console.log(`- Medium-term goals: ${obj.medium_term.length}`);
                    console.log(`- Long-term goals: ${obj.long_term.length}`);

                    // Insert short-term goals
                    for (const shortTerm of obj.short_term) {
                        try {
                            await db.insert(goal).values({
                                id: nanoid(),
                                objectiveId: newObjective.id,
                                action: shortTerm.action,
                                timeframe: 'short_term',
                                createdAt: now,
                                updatedAt: now
                            });
                            console.log('Added short-term goal:', shortTerm.action.substring(0, 50) + '...');
                        } catch (error) {
                            console.error('Error inserting short-term goal:', error);
                            throw error;
                        }
                    }

                    // Insert medium-term goals
                    for (const mediumTerm of obj.medium_term) {
                        try {
                            await db.insert(goal).values({
                                id: nanoid(),
                                objectiveId: newObjective.id,
                                action: mediumTerm.action,
                                timeframe: 'medium_term',
                                createdAt: now,
                                updatedAt: now
                            });
                            console.log('Added medium-term goal:', mediumTerm.action.substring(0, 50) + '...');
                        } catch (error) {
                            console.error('Error inserting medium-term goal:', error);
                            throw error;
                        }
                    }

                    // Insert long-term goals
                    for (const longTerm of obj.long_term) {
                        try {
                            await db.insert(goal).values({
                                id: nanoid(),
                                objectiveId: newObjective.id,
                                action: longTerm.action,
                                timeframe: 'long_term',
                                createdAt: now,
                                updatedAt: now
                            });
                            console.log('Added long-term goal:', longTerm.action.substring(0, 50) + '...');
                        } catch (error) {
                            console.error('Error inserting long-term goal:', error);
                            throw error;
                        }
                    }
                } catch (error) {
                    console.error('Error processing objective:', error);
                    throw error;
                }
            }
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
