import { db } from '../index';
import { goal } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateGoal(id: string, action: string) {
  const [updatedGoal] = await db
    .update(goal)
    .set({
      action,
      updatedAt: new Date()
    })
    .where(eq(goal.id, id))
    .returning();

  return updatedGoal;
}

export async function deleteGoal(id: string) {
  const [deletedGoal] = await db
    .delete(goal)
    .where(eq(goal.id, id))
    .returning();

  return deletedGoal;
} 