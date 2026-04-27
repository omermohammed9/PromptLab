import { BaseProvider } from "./interface";
import { GeminiProvider } from "./providers/google";
import { QwenProvider, Llama3Provider, DeepSeekProvider } from "./providers/huggingface";
import { OpenRouterProvider } from "./providers/openrouter";
import { GroqProvider } from "./providers/groq";

export function getAvailableProviders(): BaseProvider[] {
  return [
    new DeepSeekProvider(),
    new QwenProvider(),
    new GeminiProvider(),
    new Llama3Provider(),
    new OpenRouterProvider(),
    new GroqProvider(),
  ];
}
