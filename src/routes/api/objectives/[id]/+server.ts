import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { updateObjective, deleteObjective } from '$lib/server/db/mutations/objectives';
import { invalidateCache } from '$lib/server/cache';

export async function PATCH({ params, request, locals }: RequestEvent) {
  try {
    const { name } = await request.json();
    
    if (!name?.trim()) {
      return json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedObjective = await updateObjective(params.id as string, name);

    if (!updatedObjective) {
      return json({ error: 'Objective not found' }, { status: 404 });
    }

    // Invalidate cache for the user
    if (locals.user) {
      invalidateCache(locals.user.id);
    }

    return json({ success: true, objective: updatedObjective });
  } catch (error) {
    console.error('Failed to update objective:', error);
    return json({ error: 'Failed to update objective' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }: RequestEvent) {
  try {
    const deletedObjective = await deleteObjective(params.id as string);

    if (!deletedObjective) {
      return json({ error: 'Objective not found' }, { status: 404 });
    }

    // Invalidate cache for the user
    if (locals.user) {
      invalidateCache(locals.user.id);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Failed to delete objective:', error);
    return json({ error: 'Failed to delete objective' }, { status: 500 });
  }
} 