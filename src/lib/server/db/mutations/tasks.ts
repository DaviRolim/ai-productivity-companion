import { db } from '../index';
import { task } from '../schema';
import { eq } from 'drizzle-orm';

type UpdateTaskData = {
  description: string;
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  estimated_time: string;
  completed?: boolean;
};

export async function updateTask(id: string, data: UpdateTaskData) {
  const [updatedTask] = await db
    .update(task)
    .set({
      description: data.description,
      difficultyLevel: data.difficulty_level,
      estimatedTime: data.estimated_time,
      completed: data.completed ?? false,
      updatedAt: new Date()
    })
    .where(eq(task.id, id))
    .returning();

  return updatedTask;
}

export async function deleteTask(id: string) {
  const [deletedTask] = await db
    .delete(task)
    .where(eq(task.id, id))
    .returning();

  return deletedTask;
} 