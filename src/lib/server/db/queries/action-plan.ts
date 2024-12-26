import { db } from '../index';
import { eq } from 'drizzle-orm';
import { actionPlan, objective, goal } from '../schema';
import type { User } from '../schema';
import { transformToFrontendFormat } from '../../../adapters/current-plan-adapter';
import { getGoalsForObjective } from './goals';
import { getTasksForGoal } from './tasks';
import { getCachedActionPlan, setCachedActionPlan } from '../../cache';

// Define interfaces for the data structures
interface ObjectiveInput {
  name: string;
  short_term: { action: string }[];
  medium_term: { action: string }[];
  long_term: { action: string }[];
}

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

export async function createActionPlanWithObjectivesAndGoals(userId: User['id'], objectives: ObjectiveInput[]) {
  console.log('📊 [DB] Creating new action plan with objectives for user:', userId);
  const now = new Date();
  
  try {
    return await db.transaction(async (tx) => {
      // Create action plan
      const [newActionPlan] = await tx.insert(actionPlan).values({
        id: crypto.randomUUID(),
        userId,
        createdAt: now,
        updatedAt: now
      }).returning();

      // Create objectives and goals
      for (const obj of objectives) {
        const [newObjective] = await tx.insert(objective).values({
          id: crypto.randomUUID(),
          actionPlanId: newActionPlan.id,
          name: obj.name,
          createdAt: now,
          updatedAt: now
        }).returning();

        // Insert short-term goals
        for (const shortTerm of obj.short_term) {
          await tx.insert(goal).values({
            id: crypto.randomUUID(),
            objectiveId: newObjective.id,
            action: shortTerm.action,
            timeframe: 'short_term',
            createdAt: now,
            updatedAt: now
          });
        }

        // Insert medium-term goals
        for (const mediumTerm of obj.medium_term) {
          await tx.insert(goal).values({
            id: crypto.randomUUID(),
            objectiveId: newObjective.id,
            action: mediumTerm.action,
            timeframe: 'medium_term',
            createdAt: now,
            updatedAt: now
          });
        }

        // Insert long-term goals
        for (const longTerm of obj.long_term) {
          await tx.insert(goal).values({
            id: crypto.randomUUID(),
            objectiveId: newObjective.id,
            action: longTerm.action,
            timeframe: 'long_term',
            createdAt: now,
            updatedAt: now
          });
        }
      }

      return newActionPlan;
    });
  } catch (error) {
    console.error('❌ [DB] Error creating action plan:', error);
    throw error;
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

export async function getFormattedActionPlan(userId: User['id']) {
  console.log('🎯 Starting to get formatted action plan for user:', userId);
  try {
    // Check cache first
    const cached = getCachedActionPlan(userId);
    if (cached !== undefined) {
      console.log('🎯 Returning cached action plan');
      return cached;
    }

    const plan = await getFullActionPlan(userId);
    if (!plan) return null;
    const formatted = transformToFrontendFormat(plan);
    
    // Cache the result
    setCachedActionPlan(userId, formatted);
    
    console.log('🎯 Finished getting formatted action plan');
    return formatted;
  } catch (error) {
    console.error('❌ Error in getFormattedActionPlan:', error);
    return null;
  }
} 