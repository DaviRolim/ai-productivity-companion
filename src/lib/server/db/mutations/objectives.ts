import { db } from '../index';
import { objective } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateObjective(id: string, name: string) {
  const [updatedObjective] = await db
    .update(objective)
    .set({
      name,
      updatedAt: new Date()
    })
    .where(eq(objective.id, id))
    .returning();

  return updatedObjective;
}

export async function deleteObjective(id: string) {
  const [deletedObjective] = await db
    .delete(objective)
    .where(eq(objective.id, id))
    .returning();

  return deletedObjective;
} 