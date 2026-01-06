import {
  CharacterTextSplitter,
  RecursiveCharacterTextSplitter,
} from "npm:langchain/text_splitter";
import { ChunkingConfig } from "./types.ts";

export async function splitText(
  content: string,
  config: ChunkingConfig,
): Promise<string[]> {
  const splitter = config.strategy === "character"
    ? new CharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    })
    : new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });

  return splitter.splitText(content);
}
