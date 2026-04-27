"use server";

import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('your-db'));
const redis = isConfigured ? Redis.fromEnv() : null;

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 5;

export interface UsageStats {
  count: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}

/**
 * Fetches the current rate limit usage for a specific user.
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  if (!redis) {
    return { count: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS, percentUsed: 0 };
  }

  const key = `rate_limit:refine:${userId}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  try {
    // 1. Prune old entries first to get an accurate count
    await redis.zremrangebyscore(key, 0, windowStart);

    // 2. Count current requests
    const count = await redis.zcard(key);

    return {
      count,
      limit: MAX_REQUESTS,
      remaining: Math.max(0, MAX_REQUESTS - count),
      percentUsed: Math.min(100, (count / MAX_REQUESTS) * 100)
    };
  } catch (error: any) {
    if (error?.message?.includes('NOPERM')) {
      // Don't spam the console for permission issues, just return empty stats
      return { count: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS, percentUsed: 0 };
    }
    console.error("Error fetching usage stats:", error);
    return { count: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS, percentUsed: 0 };
  }
}
