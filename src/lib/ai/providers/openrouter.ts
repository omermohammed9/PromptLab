import OpenAI from "openai";
import { BaseProvider } from "../interface";

export class OpenRouterProvider extends BaseProvider {
    name = "OpenRouter";
    private model: string;
  
    constructor(model = "deepseek/deepseek-r1-0528:free") {
      super("OPENROUTER_API_KEY");
      this.model = model;
      
      if (this.apiKey) {
        this.client = new OpenAI({
          apiKey: this.apiKey,
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "Prompt Lab",
          }
        });
      }
    }
  
    async generate(system: string, user: string) {
      if (!this.isActive) return null;
      try {
        const completion = await this.client.chat.completions.create({
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          model: this.model,
          temperature: 0.7,
        });
        return completion.choices[0]?.message?.content || null;
      } catch (e) {
        this.logError(e);
        return null;
      }
    }
  }