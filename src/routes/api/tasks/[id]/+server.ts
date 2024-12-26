import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { task } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH({ params, request }: RequestEvent) {
  try {
    const { description, difficulty_level, estimated_time } = await request.json();
    
    if (!description?.trim()) {
      return json({ error: 'Description is required' }, { status: 400 });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty_level)) {
      return json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    if (!estimated_time?.trim()) {
      return json({ error: 'Estimated time is required' }, { status: 400 });
    }

    const [updatedTask] = await db
      .update(task)
      .set({
        description,
        difficultyLevel: difficulty_level,
        estimatedTime: estimated_time,
        updatedAt: new Date()
      })
      .where(eq(task.id, params.id as string))
      .returning();

    if (!updatedTask) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Failed to update task:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE({ params }: RequestEvent) {
  try {
    const [deletedTask] = await db
      .delete(task)
      .where(eq(task.id, params.id as string))
      .returning();

    if (!deletedTask) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 