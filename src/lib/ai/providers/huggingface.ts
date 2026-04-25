import { InferenceClient } from "@huggingface/inference";
import { BaseProvider } from "../interface";

// 🇨🇳 DEEPSEEK (Logic Expert)
export class DeepSeekProvider extends BaseProvider {
  name = "DeepSeek-R1-Distill";
  constructor() {
    super("HUGGINGFACE_API_KEY");
    if (this.apiKey) this.client = new InferenceClient(this.apiKey);
  }
  async generate(system: string, user: string) {
    if (!this.isActive) return null;
    try {
      const result = await this.client.chatCompletion({
        model: "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
        messages: [
          { role: "system", content: system + " Respond ONLY in JSON." },
          { role: "user", content: user },
        ],
        max_tokens: 1024,
        temperature: 0.6,
      });
      return result.choices[0].message.content;
    } catch (e) {
      this.logError(e);
      return null;
    }
  }
}

// 🇨🇳 QWEN (Coding Expert)
export class QwenProvider extends BaseProvider {
  name = "Qwen-2.5";
  constructor() {
    super("HUGGINGFACE_API_KEY");
    if (this.apiKey) this.client = new InferenceClient(this.apiKey);
  }
  async generate(system: string, user: string) {
    if (!this.isActive) return null;
    try {
      const result = await this.client.chatCompletion({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          { role: "system", content: system + " Respond ONLY in JSON." },
          { role: "user", content: user },
        ],
        max_tokens: 1024,
        temperature: 0.5,
      });
      return result.choices[0].message.content;
    } catch (e) {
      this.logError(e);
      return null;
    }
  }
}

// 🇺🇸 LLAMA 3.1 (Reliable Standard)
export class Llama3Provider extends BaseProvider {
  name = "Llama-3.1";
  constructor() {
    super("HUGGINGFACE_API_KEY");
    if (this.apiKey) this.client = new InferenceClient(this.apiKey);
  }
  async generate(system: string, user: string) {
    if (!this.isActive) return null;
    try {
      const result = await this.client.chatCompletion({
        model: "meta-llama/Llama-3.1-8B-Instruct:novita",
        messages: [
          { role: "system", content: system + " Respond ONLY in JSON." },
          { role: "user", content: user },
        ],
        max_tokens: 1024,
        temperature: 0.5,
      });
      return result.choices[0].message.content;
    } catch (e) {
      this.logError(e);
      return null;
    }
  }
}