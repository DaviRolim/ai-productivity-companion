import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { objective } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { invalidateCache } from '$lib/server/cache';

export async function PATCH({ params, request, locals }: RequestEvent) {
  try {
    const { name } = await request.json();
    
    if (!name?.trim()) {
      return json({ error: 'Name is required' }, { status: 400 });
    }

    const [updatedObjective] = await db
      .update(objective)
      .set({
        name,
        updatedAt: new Date()
      })
      .where(eq(objective.id, params.id as string))
      .returning();

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
    const [deletedObjective] = await db
      .delete(objective)
      .where(eq(objective.id, params.id as string))
      .returning();

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