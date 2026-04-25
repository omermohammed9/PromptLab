import { BaseProvider, AIProviderError, parseAIResponse } from "./interface";
import { GeminiProvider } from "./providers/google";
import { DeepSeekProvider, Llama3Provider, QwenProvider } from "./providers/huggingface";
import { OpenRouterProvider } from "./providers/openrouter";
import { GroqProvider } from "./providers/groq";

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

export async function generateContent(systemPrompt: string, userPrompt: string) {
  
  // 🟢 PRIORITY ORDER
  // Defines which AI is called first.
  const providers: BaseProvider[] = [
    new DeepSeekProvider(),
    new QwenProvider(),
    new GeminiProvider(),
    new Llama3Provider(),
    new OpenRouterProvider(),
    new GroqProvider(),
  ];

  // Filter out providers with missing API keys
  const activeProviders = providers.filter(p => p.isActive);

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
          console.log(JSON.stringify({
            provider: provider.name,
            latency_ms: Date.now() - start,
            success,
          }));
          return json;
        }
      }

      // rawResult was null/empty or JSON parsing failed.
      errorReason = "invalid_response";
    } catch (e) {
      errorReason = e instanceof AIProviderError ? e.reason : "invalid_response";
    } finally {
      if (!success) {
        console.log(JSON.stringify({
          provider: provider.name,
          latency_ms: Date.now() - start,
          success: false,
          error_reason: errorReason,
        }));
      }
    }
  }

  throw new Error("❌ All AI Providers failed to generate valid content.");
}