import { OpenAIEmbeddings } from "npm:langchain/embeddings/openai";
import { GoogleGenerativeAIEmbeddings } from "npm:@langchain/google-genai";
import { EmbeddingConfig } from "./types.ts";

export function createEmbeddings(config: EmbeddingConfig) {
  if (config.provider === "google") {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: config.apiKey,
      model: config.model,
    });
  }

  return new OpenAIEmbeddings({
    openAIApiKey: config.apiKey,
    modelName: config.model,
  });
}
