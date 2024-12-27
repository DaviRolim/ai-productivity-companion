import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { updateGoal, deleteGoal } from '$lib/server/db/mutations/goals';
import { invalidateCache } from '$lib/server/cache';

export async function PATCH({ params, request, locals }: RequestEvent) {
  try {
    const { action } = await request.json();
    
    if (!action?.trim()) {
      return json({ error: 'Action is required' }, { status: 400 });
    }

    const updatedGoal = await updateGoal(params.id as string, action);

    if (!updatedGoal) {
      return json({ error: 'Goal not found' }, { status: 404 });
    }

    // Invalidate cache for the user
    if (locals.user) {
      invalidateCache(locals.user.id);
    }

    return json({ success: true, goal: updatedGoal });
  } catch (error) {
    console.error('Failed to update goal:', error);
    return json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }: RequestEvent) {
  try {
    const deletedGoal = await deleteGoal(params.id as string);

    if (!deletedGoal) {
      return json({ error: 'Goal not found' }, { status: 404 });
    }

    // Invalidate cache for the user
    if (locals.user) {
      invalidateCache(locals.user.id);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return json({ error: 'Failed to delete goal' }, { status: 500 });
  }
} 