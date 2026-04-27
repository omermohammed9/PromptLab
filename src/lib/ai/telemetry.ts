import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('your-db'));
const redis = isConfigured ? Redis.fromEnv() : null;

export interface TelemetryEvent {
  provider: string;
  latency: number;
  tokens: number;
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Logs AI provider performance metrics to Redis for analytics.
 */
export async function logAITelemetry(event: TelemetryEvent) {
  if (!redis) return;

  const now = new Date();
  const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timestamp = now.getTime();

  try {
    const pipeline = redis.pipeline();

    // 1. Log to a time-series list for raw data (retention: 7 days)
    const eventWithTimestamp = { ...event, timestamp };
    pipeline.lpush(`telemetry:raw:${dateKey}`, JSON.stringify(eventWithTimestamp));
    pipeline.expire(`telemetry:raw:${dateKey}`, 60 * 60 * 24 * 7);

    // 2. Aggregate stats for the provider (Daily)
    const statsKey = `telemetry:stats:${dateKey}:${event.provider}`;
    pipeline.hincrby(statsKey, 'count', 1);
    if (event.success) {
      pipeline.hincrby(statsKey, 'success', 1);
      pipeline.hincrby(statsKey, 'total_latency', Math.round(event.latency));
      pipeline.hincrby(statsKey, 'total_tokens', event.tokens);
    } else {
      pipeline.hincrby(statsKey, 'errors', 1);
    }
    pipeline.expire(statsKey, 60 * 60 * 24 * 30); // 30 days retention

    // 3. Global usage (for DAU tracking if needed, though Supabase is better for this)
    if (event.userId) {
      pipeline.sadd(`telemetry:active_users:${dateKey}`, event.userId);
      pipeline.expire(`telemetry:active_users:${dateKey}`, 60 * 60 * 24 * 2);
    }

    await pipeline.exec();
  } catch (error) {
    console.error("Failed to log telemetry:", error);
  }
}

/**
 * Retrieves aggregated AI metrics for the last N days.
 */
export async function getAIMetrics(days: number = 7) {
  if (!redis) return [];

  const results = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    
    // Get all providers for this date
    const keys = await redis.keys(`telemetry:stats:${dateKey}:*`);
    
    for (const key of keys) {
      const provider = key.split(':').pop();
      const stats = await redis.hgetall(key);
      if (stats) {
        results.push({
          date: dateKey,
          provider,
          ...stats
        });
      }
    }
  }
  return results;
}
