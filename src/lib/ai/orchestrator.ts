import { BaseProvider, AIProviderError, parseAIResponse } from "./interface";
import { getAvailableProviders } from "./provider-list";
import { getPublicSystemConfig } from "@/app/[locale]/admin/system-action";
import { logAiUsage } from "@/services/analytics";

const PROVIDER_TIMEOUT_MS = 10_000;

/**
 * Races a provider.generate() call against a 10-second timeout.
 * Resolves with the raw string on success, or rejects with an AIProviderError.
 */
function generateWithTimeout(
  provider: BaseProvider,
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const generationPromise = provider.generate(systemPrompt, userPrompt);

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(new AIProviderError(provider.name, "timeout", `${provider.name} timed out after ${PROVIDER_TIMEOUT_MS}ms`));
    }, PROVIDER_TIMEOUT_MS);
    // Allow the Node.js process to exit even if the timer is still pending.
    if (typeof timer === "object" && timer.unref) timer.unref();
  });

  return Promise.race([generationPromise, timeoutPromise]);
}

export async function generateContent(
  systemPrompt: string, 
  userPrompt: string,
  options: { userId?: string; endpoint?: string } = {}
) {
  
  // 🟢 PRIORITY ORDER
  // Fetch providers directly from our central list
  const providers = getAvailableProviders();

  // Fetch system config to check Kill-Switches
  const config = await getPublicSystemConfig();

  // Filter out providers with missing API keys and apply Kill-Switch logic
  const activeProviders = providers.filter(p => {
    if (!p.isActive) return false;
    // Apply kill switches based on exact provider names
    if (config.modelToggles[p.name] === false) {
      return false;
    }
    
    return true;
  });

  if (activeProviders.length === 0) {
    throw new Error("⛔ No AI Providers configured. Check your .env file.");
  }

  // Loop through providers until one succeeds
  for (const provider of activeProviders) {
    const start = Date.now();
    let success = false;
    let errorReason: string | undefined;

    try {
      const rawResult = await generateWithTimeout(provider, systemPrompt, userPrompt);

      if (rawResult) {
        const json = parseAIResponse(rawResult);
        if (json) {
          success = true;
          const latency = Date.now() - start;
          console.log(JSON.stringify({
            provider: provider.name,
            latency_ms: latency,
            success,
          }));

          // Log Success to Database
          await logAiUsage({
            userId: options.userId || null,
            modelName: provider.name,
            endpoint: options.endpoint || 'unknown',
            status: 'success',
            latencyMs: latency
          });

          return json;
        }
      }

      // rawResult was null/empty or JSON parsing failed.
      errorReason = "invalid_response";
    } catch (e) {
      errorReason = e instanceof AIProviderError ? e.reason : "invalid_response";
    } finally {
      if (!success) {
        const latency = Date.now() - start;
        console.log(JSON.stringify({
          provider: provider.name,
          latency_ms: latency,
          success: false,
          error_reason: errorReason,
        }));

        // Log Failure to Database
        await logAiUsage({
          userId: options.userId || null,
          modelName: provider.name,
          endpoint: options.endpoint || 'unknown',
          status: 'failure',
          errorType: errorReason,
          latencyMs: latency
        });
      }
    }
  }

  throw new Error("❌ All AI Providers failed to generate valid content.");
}