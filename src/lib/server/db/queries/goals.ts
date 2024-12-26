import { db } from '../index';
import { eq } from 'drizzle-orm';
import { goal } from '../schema';

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

export async function findGoalByAction(goalAction: string) {
  console.log('📊 [DB] Finding goal by action:', goalAction);
  try {
    const [foundGoal] = await db
      .select()
      .from(goal)
      .where(eq(goal.action, goalAction));
    return foundGoal;
  } catch (error) {
    console.error('❌ [DB] Error finding goal:', error);
    throw error;
  }
} 