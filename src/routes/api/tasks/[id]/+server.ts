import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { updateTask, deleteTask } from '$lib/server/db/mutations/tasks';

export async function PATCH({ params, request }: RequestEvent) {
  try {
    const { description, difficulty_level, estimated_time, completed } = await request.json();
    
    if (!description?.trim()) {
      return json({ error: 'Description is required' }, { status: 400 });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty_level)) {
      return json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    if (!estimated_time?.trim()) {
      return json({ error: 'Estimated time is required' }, { status: 400 });
    }

    const updatedTask = await updateTask(params.id as string, {
      description,
      difficulty_level,
      estimated_time,
      completed
    });

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
    const deletedTask = await deleteTask(params.id as string);

    if (!deletedTask) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 