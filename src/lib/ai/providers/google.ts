import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseProvider } from "../interface";

export class GeminiProvider extends BaseProvider {
  name = "Gemini";

  constructor() {
    super("GEMINI_API_KEY");
    if (this.apiKey) this.client = new GoogleGenerativeAI(this.apiKey);
  }

  async generate(system: string, user: string): Promise<string | null> {
    if (!this.isActive) return null;
    try {
      // Use startChat() with explicit system and user role messages to match
      // the standard interface contract (system prompt + user turn).
      const model = this.client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: system,
      });

      const chat = model.startChat({
        history: [], // No prior history for a fresh generation call.
      });

      const result = await chat.sendMessage(user);
      return result.response.text();
    } catch (e) {
      this.logError(e); // throws AIProviderError — never returns null
    }
  }
}