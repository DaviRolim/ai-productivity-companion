import { db } from '../index';
import { eq } from 'drizzle-orm';
import { task } from '../schema';

interface TaskInput {
  description: string;
  difficulty_level: string;
  estimated_time: string;
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

export async function createTasksForGoal(goalId: string, tasks: TaskInput[]) {
  console.log('📊 [DB] Creating tasks for goal:', goalId);
  const now = new Date();
  
  try {
    return await db.transaction(async (tx) => {
      const createdTasks = [];
      for (const taskItem of tasks) {
        const [newTask] = await tx.insert(task).values({
          id: crypto.randomUUID(),
          goalId,
          description: taskItem.description,
          difficultyLevel: taskItem.difficulty_level,
          estimatedTime: taskItem.estimated_time,
          completed: false,
          createdAt: now,
          updatedAt: now
        }).returning();
        createdTasks.push(newTask);
      }
      return createdTasks;
    });
  } catch (error) {
    console.error('❌ [DB] Error creating tasks:', error);
    throw error;
  }
} 