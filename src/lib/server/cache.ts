import type { ActionPlanSchema } from '$lib/schemas';
import type { z } from 'zod';

type ActionPlan = z.infer<typeof ActionPlanSchema>;

interface CacheEntry {
  data: ActionPlan | null;
  timestamp: number;
}

const CACHE_DURATION = 5000; // 5 seconds cache duration
const cache = new Map<string, CacheEntry>();

export function getCachedActionPlan(userId: string): ActionPlan | null | undefined {
  const entry = cache.get(userId);
  if (!entry) return undefined;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(userId);
    return undefined;
  }

  return entry.data;
}

export function setCachedActionPlan(userId: string, data: ActionPlan | null): void {
  cache.set(userId, {
    data,
    timestamp: Date.now()
  });
}

export function invalidateCache(userId: string): void {
  cache.delete(userId);
} 