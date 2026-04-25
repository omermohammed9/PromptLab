import { BaseProvider } from "../interface";
import Groq from "groq-sdk";


export class GroqProvider extends BaseProvider {
    name = "Groq";
  
    constructor() {
      super("GROQ_API_KEY");
      if (this.apiKey) this.client = new Groq({ apiKey: this.apiKey });
    }
  
    async generate(system: string, user: string) {
      if (!this.isActive) return null;
      try {
        const completion = await this.client.chat.completions.create({
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          model: "llama-3.1-8b-instant", // Updated to latest stable versatile model
          temperature: 0.6,
          response_format: { type: "json_object" },
        });
        return completion.choices[0]?.message?.content || null;
      } catch (e) {
        this.logError(e);
        return null;
      }
    }
  }