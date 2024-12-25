import { db } from './index';
import { eq } from 'drizzle-orm';
import { actionPlan, objective, goal, task } from './schema';
import type { User } from './schema';
import type { ActionPlanSchema } from '$lib/schemas';
import type { z } from 'zod';

export async function getUserActionPlan(userId: User['id']) {
  console.log('📊 [DB] Fetching action plan for user:', userId);
  try {
    const plans = await db
      .select()
      .from(actionPlan)
      .where(eq(actionPlan.userId, userId))
      .orderBy(actionPlan.createdAt)
      .limit(1);

    console.log('📊 [DB] Found plans:', plans.length ? 'yes' : 'no');
    return plans[0];
  } catch (error) {
    console.error('❌ [DB] Error fetching action plan:', error);
    return null;
  }
}

export async function getObjectivesForPlan(actionPlanId: string) {
  console.log('📊 [DB] Fetching objectives for plan:', actionPlanId);
  try {
    const objectives = await db
      .select()
      .from(objective)
      .where(eq(objective.actionPlanId, actionPlanId))
      .orderBy(objective.createdAt);

    console.log('📊 [DB] Found objectives:', objectives.length);
    return objectives;
  } catch (error) {
    console.error('❌ [DB] Error fetching objectives:', error);
    return [];
  }
}

export async function getGoalsForObjective(objectiveId: string) {
  console.log('📊 [DB] Fetching goals for objective:', objectiveId);
  try {
    const goals = await db
      .select()
      .from(goal)
      .where(eq(goal.objectiveId, objectiveId))
      .orderBy(goal.createdAt);

    console.log('📊 [DB] Found goals:', goals.length);
    return goals;
  } catch (error) {
    console.error('❌ [DB] Error fetching goals:', error);
    return [];
  }
}

export async function getTasksForGoal(goalId: string) {
  console.log('📊 [DB] Fetching tasks for goal:', goalId);
  try {
    const tasks = await db.transaction(async (tx) => {
      return tx
        .select()
        .from(task)
        .where(eq(task.goalId, goalId))
        .orderBy(task.createdAt);
    });

    console.log('📊 [DB] Found tasks:', tasks.length);
    return tasks;
  } catch (error) {
    console.error('❌ [DB] Error fetching tasks:', {
      goalId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? (error.cause as Error)?.message : undefined
    });
    return [];
  }
}

export async function getFullActionPlan(userId: User['id']) {
  console.log('📊 [DB] Starting to fetch full action plan for user:', userId);
  try {
    const userPlan = await getUserActionPlan(userId);
    if (!userPlan) {
      console.log('📊 [DB] No action plan found for user');
      return null;
    }

    console.log('📊 [DB] Found action plan, fetching objectives...');
    const objectives = await getObjectivesForPlan(userPlan.id);
    
    console.log('📊 [DB] Fetching goals and tasks for each objective...');
    const objectivesWithGoals = await Promise.all(
      objectives.map(async (obj) => {
        try {
          console.log('📊 [DB] Processing objective:', obj.id);
          const goals = await getGoalsForObjective(obj.id);
          
          const goalsWithTasks = [];
          for (const goal of goals) {
            try {
              console.log('📊 [DB] Processing goal:', goal.id);
              const tasks = goal.timeframe === 'short_term' 
                ? await getTasksForGoal(goal.id)
                : [];
              goalsWithTasks.push({ ...goal, tasks });
            } catch (error) {
              console.error('❌ [DB] Error processing goal:', goal.id, error);
              goalsWithTasks.push({ ...goal, tasks: [] });
            }
          }
          
          return { ...obj, goals: goalsWithTasks };
        } catch (error) {
          console.error('❌ [DB] Error processing objective:', obj.id, error);
          return { ...obj, goals: [] };
        }
      })
    );

    console.log('📊 [DB] Successfully built full action plan');
    return {
      ...userPlan,
      objectives: objectivesWithGoals
    };
  } catch (error) {
    console.error('❌ [DB] Error building full action plan:', error);
    return null;
  }
}

function transformToFrontendFormat(dbPlan: Awaited<ReturnType<typeof getFullActionPlan>>): z.infer<typeof ActionPlanSchema> | null {
  console.log('🔄 Starting to transform data to frontend format');
  try {
    if (!dbPlan) {
      console.log('🔄 No plan to transform');
      return null;
    }

    const transformed = {
      objectives: dbPlan.objectives.map(obj => ({
        name: obj.name,
        short_term: (obj.goals || [])
          .filter(g => g.timeframe === 'short_term')
          .map(g => ({ 
            action: g.action,
            tasks: (g.tasks || []).map(t => ({
              description: t.description,
              difficulty_level: t.difficultyLevel as "Easy" | "Medium" | "Hard",
              estimated_time: t.estimatedTime
            }))
          })),
        medium_term: (obj.goals || [])
          .filter(g => g.timeframe === 'medium_term')
          .map(g => ({ 
            action: g.action,
            tasks: (g.tasks || []).map(t => ({
              description: t.description,
              difficulty_level: t.difficultyLevel as "Easy" | "Medium" | "Hard",
              estimated_time: t.estimatedTime
            }))
          })),
        long_term: (obj.goals || [])
          .filter(g => g.timeframe === 'long_term')
          .map(g => ({ 
            action: g.action,
            tasks: (g.tasks || []).map(t => ({
              description: t.description,
              difficulty_level: t.difficultyLevel as "Easy" | "Medium" | "Hard",
              estimated_time: t.estimatedTime
            }))
          }))
      }))
    };

    console.log('🔄 Successfully transformed data');
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming data:', error);
    return null;
  }
}

export async function getFormattedActionPlan(userId: User['id']) {
  console.log('🎯 Starting to get formatted action plan for user:', userId);
  try {
    const plan = await getFullActionPlan(userId);
    const formatted = transformToFrontendFormat(plan);
    console.log('🎯 Finished getting formatted action plan');
    return formatted;
  } catch (error) {
    console.error('❌ Error in getFormattedActionPlan:', error);
    return null;
  }
} 