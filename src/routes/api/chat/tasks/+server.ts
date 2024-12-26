import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ACTION_PLAN_PROMPT, ACTION_PLAN_PROMPT_PT } from '$lib/prompts';
import { ActionableTasksSchema } from '$lib/schemas';
import { zodResponseFormat } from 'openai/helpers/zod';
import { createTasksForGoal, findGoalByAction } from '$lib/server/db/queries';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request, locals }) => {
    console.log('Received tasks request');
    
    if (!locals.user) {
        console.log('Authentication failed: No user found in locals');
        return json({
            success: false,
            error: 'Authentication required'
        }, { status: 401 });
    }
	try {
		const body = await request.json();
		const { objective, shortTermGoal } = body;
		console.log('Received request data:', { 
            objective: objective ? 'Valid objective' : 'Empty objective',
            shortTermGoal: shortTermGoal ? 'Valid goal' : 'Empty goal'
        });

		// Get language from Accept-Language header
		const acceptLanguage = request.headers.get('accept-language') || '';
		const isPortuguese = acceptLanguage.toLowerCase().includes('pt');
		console.log('Language detection:', isPortuguese ? 'Portuguese' : 'English');

		if (!objective || !shortTermGoal) {
			console.log('Request rejected: Missing required fields');
			return json({ 
                success: false,
                error: 'Objective and short term goal are required' 
            }, { status: 400 });
		}
		
		const userPrompt = `
            <input>
                <objective>
                    <name>${objective}</name>
                    <short-term>
                        <goal>${shortTermGoal}</goal>
                    </short-term>
                </objective>
            </input>`;

		console.log('Making OpenAI API request...');
		const completion = await openai.beta.chat.completions.parse({
			messages: [
				{ role: 'system', content: isPortuguese ? ACTION_PLAN_PROMPT_PT : ACTION_PLAN_PROMPT },
				{ role: 'user', content: userPrompt }
			],
			model: 'gpt-4o-mini',
			response_format: zodResponseFormat(ActionableTasksSchema, 'actionable_tasks')
		});
		console.log('OpenAI API response received');

		const response = completion.choices[0]?.message;

		if (!response) {
			console.error('OpenAI response missing message content');
			throw new Error('No response from OpenAI');
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

		console.log('Starting database operations...');
		
		try {
            console.log('Looking up goal in database...');
            const goalRecord = await findGoalByAction(shortTermGoal);

            if (!goalRecord) {
                console.log('Goal not found in database:', shortTermGoal);
                return json(
                    {
                        success: false,
                        error: 'Goal not found in database'
                    },
                    { status: 404 }
                );
            }
            console.log('Found goal record:', goalRecord.id);
            
            // Save tasks to database
            console.log(`Processing ${parsedResponse.objective.tasks.length} tasks...`);
            await createTasksForGoal(goalRecord.id, parsedResponse.objective.tasks);
            console.log('Database operations completed successfully');

            return json({
                success: true,
                tasks: parsedResponse
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
                    error: 'Failed to save tasks to database'
                },
                { status: 500 }
            );
        }
	} catch (error) {
		console.error('Error in tasks endpoint:', error);
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
				error: 'Failed to get tasks from AI'
			},
			{ status: 500 }
		);
	}
};
