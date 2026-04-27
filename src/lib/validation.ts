import { z } from 'zod'
import { Filter } from 'bad-words'
import { Redis } from '@upstash/redis'

// Initialize the profanity filter
const filter = new Filter()

// --- HELPER FUNCTIONS ---

// 1. Check if text is mostly non-letters (e.g. "123456" or "??!@#$")
// Returns true if letters make up less than 50% of the text
const isMostlySymbols = (text: string) => {
  const letters = text.replace(/[^a-zA-Z]/g, '').length
  return letters < text.length * 0.5
}

// 2. Check for repeating words (e.g. "test test test")
// Returns true if unique words are less than 50% of total words (for inputs > 5 words)
const isRepetitive = (text: string) => {
  const words = text.toLowerCase().trim().split(/\s+/)
  const uniqueWords = new Set(words)
  return words.length > 5 && uniqueWords.size < words.length * 0.5
}

// --- ZOD SCHEMA ---

export const PromptInputSchema = z.string()
  // 1. Basic Length Checks
  .min(10, "Prompt is too short to refine (min 10 chars)")
  .max(1000, "Prompt is too long (max 1000 chars)")

  // 2. The "Keysmash" Block (e.g., "ljsbdsdbipsndpg")
  // Checks if any single word is longer than 25 characters
  .refine((val) => {
    const words = val.split(/\s+/)
    return !words.some(word => word.length > 25)
  }, "Contains suspiciously long words. Please use spaces.")

  // 3. The "Minimal Effort" Block
  // Requires at least 3 distinct words
  .refine((val) => {
    const words = val.trim().split(/\s+/)
    return words.length >= 3
  }, "Please write at least 3 words to get a good result.")

  // 4. The "Symbol Spam" Block (e.g., "!!!!!????")
  .refine((val) => !isMostlySymbols(val), "Prompt contains too many symbols or numbers. Please write in sentences.")

  // 5. The "Copy-Paste Spam" Block (e.g., "test test test")
  .refine((val) => !isRepetitive(val), "Prompt is too repetitive. Please explain clearly.")

  // 6. The "Profanity" Block (bad-words library)
  .refine((val) => !filter.isProfane(val), "Please avoid using offensive language.")


// --- ACTION VALIDATION ---

// Schema for simple ID-based actions (Like, Remix, Delete)
export const ActionSchema = z.object({
  id: z.string().uuid("Invalid Prompt ID format")
})


// --- RATE LIMITER ---

// Sliding window rate limiter backed by Upstash Redis.
// Allows MAX_REQUESTS per user within WINDOW_SECONDS.
// Key scheme: rate_limit:refine:{userId}
const WINDOW_SECONDS = 60  // 1-minute sliding window
const MAX_REQUESTS = 5     // max refinements per window
const MAX_DAILY_REQUESTS = 20 // max daily refinements

// Lazily initialised from env — works in both Vercel and local dev.
// Required env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Check if credentials are valid (not placeholders)
const isConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('your-db'))
const redis = isConfigured ? Redis.fromEnv() : null

export async function checkRateLimit(userId: string): Promise<void> {
  if (!redis) {
    console.warn("⚠️ Upstash Redis not configured. Bypassing rate limit.")
    return
  }
  
  // 1. Check Daily Quota first
  const today = new Date().toISOString().split('T')[0]
  const dailyKey = `quota:refine:${userId}:${today}`
  const dailyCountStr = await redis.get<string | number>(dailyKey)
  const dailyCount = typeof dailyCountStr === 'number' ? dailyCountStr : parseInt(dailyCountStr || "0", 10)
  
  if (dailyCount >= MAX_DAILY_REQUESTS) {
    throw new Error(`Daily limit exceeded. You have reached your ${MAX_DAILY_REQUESTS} AI refinements for today. Please try again tomorrow for fair usage.`)
  }

  // 2. Check Per-Minute Sliding Window
  const key = `rate_limit:refine:${userId}`
  const now = Date.now()
  const windowStart = now - WINDOW_SECONDS * 1000

  // Use a Redis sorted set:
  //   member  = timestamp (stringified, unique via suffix)
  //   score   = timestamp (ms) — used for range queries
  const member = `${now}-${Math.random().toString(36).slice(2)}`

  // Atomic pipeline: add current request, prune old entries, count remaining
  const pipeline = redis.pipeline()

  // 1. Remove all entries outside the current window
  pipeline.zremrangebyscore(key, 0, windowStart)

  // 2. Add the current request
  pipeline.zadd(key, { score: now, member })

  // 3. Count total requests in the window
  pipeline.zcard(key)

  // 4. Reset the TTL so the key auto-expires after inactivity
  pipeline.expire(key, WINDOW_SECONDS * 2)

  try {
    const results = await pipeline.exec()

    // zcard result is the 3rd command (index 2)
    const requestCount = results[2] as number

    if (requestCount > MAX_REQUESTS) {
      // Roll back the request we just added so it doesn't pollute the window
      await redis.zrem(key, member)
      throw new Error(
        `Rate limit exceeded. You may refine up to ${MAX_REQUESTS} prompts per minute. Please wait and try again.`
      )
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    if (err.message?.includes('NOPERM')) {
      console.warn("⚠️ Redis Read-Only token detected. Rate limiting is disabled. Please use a standard token for full functionality.")
      return
    }
    throw error
  }
}