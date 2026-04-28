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
    const startTime = Date.now();
    let resultText: string | null = null;

    try {
      const model = this.client.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: system,
      });

      const chat = model.startChat({
        history: [], 
      });

      const result = await chat.sendMessage(user);
      resultText = result.response.text();
      
      // Record Success
      await this.recordTelemetry(startTime, true, system + user, resultText);
      
      return resultText;
    } catch (e) {
      // Record Failure
      await this.recordTelemetry(startTime, false, system + user, null, e);
      this.logError(e); 
    }
  }
}