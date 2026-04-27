import { AIProvider } from "@/types/interface"; // Your existing interface
import { logAITelemetry } from "./telemetry";

// ─── Typed Provider Error ────────────────────────────────────────────────────
export type AIProviderErrorReason =
  | "timeout"
  | "rate_limit"
  | "invalid_response"
  | "auth";

export class AIProviderError extends Error {
  readonly reason: AIProviderErrorReason;
  readonly providerName: string;

  constructor(providerName: string, reason: AIProviderErrorReason, message?: string) {
    super(message ?? `${providerName} failed: ${reason}`);
    this.name = "AIProviderError";
    this.reason = reason;
    this.providerName = providerName;
  }
}

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  protected client: any;

  protected apiKey: string | undefined;

  constructor(envKeyName: string) {
    this.apiKey = process.env[envKeyName];
  }

  get isActive(): boolean {
    return !!this.apiKey;
  }

  abstract generate(system: string, user: string): Promise<string | null>;

  /**
   * Maps a raw caught error to a typed AIProviderError and throws it.
   * Callers should catch AIProviderError to inspect the reason discriminant.
   */
  protected logError(error: unknown): never {
    let reason: AIProviderErrorReason = "invalid_response";

    if (error instanceof AIProviderError) {
      throw error; // Already typed — re-throw as-is.
    }

    const msg: string =
      error instanceof Error ? error.message : String(error);

    if (/timeout|timed out|deadline/i.test(msg)) {
      reason = "timeout";
    } else if (/rate.?limit|429|too many requests/i.test(msg)) {
      reason = "rate_limit";
    } else if (/auth|api.?key|unauthorized|403/i.test(msg)) {
      reason = "auth";
    }

    throw new AIProviderError(this.name, reason, msg);
  }

  /**
   * Helper to estimate tokens (approx 4 chars per token)
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Helper to record metrics
   */
  protected async recordTelemetry(startTime: number, success: boolean, input: string, output?: string | null, error?: any) {
    const latency = Date.now() - startTime;
    const tokens = this.estimateTokens(input + (output || ""));
    
    await logAITelemetry({
      provider: this.name,
      latency,
      tokens,
      success,
      error: error ? String(error) : undefined
    });
  }
}

// Shared Utility for cleaning JSON
export function parseAIResponse(text: string | null): unknown {
  if (!text) return null;
  try {
    let clean = text.replace(/```json|```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  } catch (_e: unknown) {
    console.error("❌ JSON Parse Error. Raw text:", text);
    return null;
  }
}