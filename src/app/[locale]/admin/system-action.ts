"use server";

import { createClient } from "../../../lib/supabase/server";
import { requireAdmin } from "../../../lib/security";
import { Redis } from '@upstash/redis';
import { revalidatePath } from "next/cache";
import { getAvailableProviders } from "../../../lib/ai/provider-list";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN && !UPSTASH_URL.includes('your-db'));
const redis = isConfigured ? Redis.fromEnv() : null;

export interface SystemConfig {
  maintenanceMode: boolean;
  globalBanner: string;
  modelToggles: Record<string, boolean>;
}

const DEFAULT_CONFIG: SystemConfig = {
  maintenanceMode: false,
  globalBanner: "",
  modelToggles: {}
};

function getMergedConfig(savedConfig: Partial<SystemConfig> | null): SystemConfig {
  const providers = getAvailableProviders();
  const mergedToggles: Record<string, boolean> = {};
  
  // Default all active providers to true
  providers.forEach((p) => {
    mergedToggles[p.name] = true;
  });

  // Override with any saved preferences
  if (savedConfig?.modelToggles) {
    const toggles = savedConfig.modelToggles;
    Object.keys(toggles).forEach(k => {
      if (mergedToggles.hasOwnProperty(k)) {
        mergedToggles[k] = toggles[k];
      }
    });
  }

  return {
    maintenanceMode: savedConfig?.maintenanceMode ?? false,
    globalBanner: savedConfig?.globalBanner ?? "",
    modelToggles: mergedToggles
  };
}

export async function getPublicSystemConfig(): Promise<SystemConfig> {
  if (!redis) {
    return getMergedConfig(DEFAULT_CONFIG);
  }
  try {
    const config = await redis.get<SystemConfig>('admin:system_config');
    return getMergedConfig(config || DEFAULT_CONFIG);
  } catch (error) {
    return getMergedConfig(DEFAULT_CONFIG);
  }
}

export async function getSystemConfigAction(): Promise<SystemConfig> {
  const supabase = createClient();
  await requireAdmin(supabase);

  if (!redis) {
    return getMergedConfig(DEFAULT_CONFIG);
  }

  try {
    const config = await redis.get<SystemConfig>('admin:system_config');
    return getMergedConfig(config || DEFAULT_CONFIG);
  } catch (error) {
    console.error("Failed to fetch system config:", error);
    return getMergedConfig(DEFAULT_CONFIG);
  }
}

export async function updateSystemConfigAction(newConfig: SystemConfig) {
  const supabase = createClient();
  await requireAdmin(supabase);

  if (!redis) {
    throw new Error("Redis is not configured. Cannot save system settings.");
  }

  try {
    await redis.set('admin:system_config', newConfig);
    revalidatePath('/', 'layout'); // Revalidate all pages to show/hide banner and maintenance
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update system config:", error);
    if (error.message?.includes('NOPERM')) {
      throw new Error("Redis Token is Read-Only. Please provide a token with Write permissions.");
    }
    throw new Error("Failed to update system configuration");
  }
}

export async function pruneRedisAction() {
  const supabase = createClient();
  await requireAdmin(supabase);

  if (!redis) {
    throw new Error("Redis is not configured.");
  }

  try {
    let cursor = '0';
    let count = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: 'rate_limit:*', count: 100 });
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        count += keys.length;
      }
    } while (cursor !== '0');

    return { success: true, count };
  } catch (error: any) {
    console.error("Failed to prune Redis:", error);
    if (error.message?.includes('NOPERM')) {
      throw new Error("Redis Token is Read-Only. Please provide a token with Write permissions.");
    }
    throw new Error("Failed to prune cache");
  }
}
