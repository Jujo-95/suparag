import { ChatOpenAI } from "npm:langchain/chat_models/openai";
import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";
import { HumanMessage, SystemMessage } from "npm:langchain/schema";
import { LlmConfig } from "./types.ts";

export function createChatModel(config: LlmConfig) {
  if (config.provider === "google") {
    return new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature ?? 0.2,
    });
  }

  return new ChatOpenAI({
    openAIApiKey: config.apiKey,
    modelName: config.model,
    temperature: config.temperature ?? 0.2,
  });
}

export async function generateAnswer(params: {
  llm: LlmConfig;
  question: string;
  context: string;
}) {
  const chat = createChatModel(params.llm);
  const response = await chat.call([
    new SystemMessage(
      "You are a helpful RAG assistant. Answer using the provided context. If the context is insufficient, say so.",
    ),
    new HumanMessage(
      `Context:\n${params.context}\n\nQuestion:\n${params.question}`,
    ),
  ]);

  return response.content;
}
