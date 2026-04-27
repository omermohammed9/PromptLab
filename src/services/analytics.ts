"use server";

import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase/server';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('your-db'));
const redis = isConfigured ? Redis.fromEnv() : null;

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_MINUTE = 5;
const MAX_REQUESTS_PER_DAY = 20;

export interface UsageStats {
  count: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}

/**
 * Fetches the current DAILY rate limit usage for a specific user.
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  if (!redis) {
    return { count: 0, limit: MAX_REQUESTS_PER_DAY, remaining: MAX_REQUESTS_PER_DAY, percentUsed: 0 };
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `quota:refine:${userId}:${today}`;

  try {
    const countStr = await redis.get<string | number>(key);
    const count = typeof countStr === 'number' ? countStr : parseInt(countStr || "0", 10);
    
    return {
      count,
      limit: MAX_REQUESTS_PER_DAY,
      remaining: Math.max(0, MAX_REQUESTS_PER_DAY - count),
      percentUsed: Math.min(100, (count / MAX_REQUESTS_PER_DAY) * 100)
    };
  } catch (error) {
    console.error("Error fetching daily usage stats:", error);
    return { count: 0, limit: MAX_REQUESTS_PER_DAY, remaining: MAX_REQUESTS_PER_DAY, percentUsed: 0 };
  }
}

/**
 * Increments the daily counter for a user
 */
export async function incrementUserDailyUsage(userId: string): Promise<void> {
  if (!redis) return;
  const today = new Date().toISOString().split('T')[0];
  const key = `quota:refine:${userId}:${today}`;
  try {
    await redis.incr(key);
    await redis.expire(key, 60 * 60 * 48); // Expire after 48 hours to be safe
  } catch (error) {
    console.error("Failed to increment daily usage:", error);
  }
}

/**
 * Persistently logs the AI usage to Supabase for admin analytics and billing tracking.
 */
export async function logAiUsage(data: {
  userId: string | null;
  modelName: string;
  endpoint: string;
  status: 'success' | 'failure';
  errorType?: string;
  latencyMs?: number;
}) {
  try {
    const supabase = await createClient();
    await supabase.from('ai_usage_logs').insert({
      user_id: data.userId,
      model_name: data.modelName,
      endpoint: data.endpoint,
      status: data.status,
      error_type: data.errorType || null,
      latency_ms: data.latencyMs || null
    });
  } catch (error) {
    console.error("Failed to insert AI usage log:", error);
  }
}
