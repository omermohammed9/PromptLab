import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

/**
 * Generates a vector embedding for a given text using Google's gemini-embedding-2 model.
 * Returns an array of numbers (the vector).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    console.warn("getEmbedding: Empty text provided");
    return [];
  }

  try {
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
  } catch (error: unknown) {
    console.error("Error generating embedding:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Embedding failed: ${message}`);
  }
}
