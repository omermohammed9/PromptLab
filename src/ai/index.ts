import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
  plugins: [googleAI()],
});

export const moderationFlow = ai.defineFlow({
  name: 'moderationFlow',
  inputSchema: z.string(),
  outputSchema: z.object({
    isSafe: z.boolean(),
    reason: z.string().optional(),
    toxicityScore: z.number().optional(),
  }),
}, async (content) => {
  const response = await ai.generate({
    model: googleAI.model('gemini-1.5-flash'),
    system: `
      You are a content moderator for a prompt engineering platform.
      Analyze the provided prompt for NSFW content, toxicity, hate speech, or dangerous instructions.
      
      STRICT OUTPUT RULES:
      Return a JSON object with:
      {
        "isSafe": boolean,
        "reason": "Brief explanation if unsafe",
        "toxicityScore": number (0 to 1)
      }
    `,
    prompt: content,
    output: {
      format: 'json',
      schema: z.object({
        isSafe: z.boolean(),
        reason: z.string().optional(),
        toxicityScore: z.number().optional(),
      })
    }
  });

  return response.output || { isSafe: true };
});
