import {
  ChunkingConfig,
  EmbeddingConfig,
  GenerateConfig,
  IngestConfig,
  LlmConfig,
  SearchConfig,
  SetupConfig,
} from "./types.ts";

export const DEFAULT_SCHEMA = "suparag";
export const DEFAULT_TABLE = "chunks";
export const DEFAULT_MATCH_FUNCTION = "match_chunks";

export function withDefaults<T extends { schema?: string; table?: string }>(
  config: T,
): T & { schema: string; table: string } {
  return {
    ...config,
    schema: config.schema ?? DEFAULT_SCHEMA,
    table: config.table ?? DEFAULT_TABLE,
  };
}

export function withSearchDefaults<T extends { matchFunction?: string }>(
  config: T,
): T & { matchFunction: string } {
  return {
    ...config,
    matchFunction: config.matchFunction ?? DEFAULT_MATCH_FUNCTION,
  };
}

export async function readJson<T>(req: Request): Promise<T> {
  const body = await req.json();
  return body as T;
}

export function assertSupabaseConfig(config: SetupConfig | IngestConfig) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey || !config.databaseUrl) {
    throw new Error("Missing supabaseUrl, supabaseServiceRoleKey, or databaseUrl");
  }
}

export function assertEmbeddingConfig(config: EmbeddingConfig) {
  if (!config.apiKey || !config.model) {
    throw new Error("Embedding config requires apiKey and model");
  }
}

export function assertChunkingConfig(config: ChunkingConfig) {
  if (!config.chunkSize || !config.chunkOverlap) {
    throw new Error("Chunking config requires chunkSize and chunkOverlap");
  }
}

export function assertLlmConfig(config: LlmConfig) {
  if (!config.apiKey || !config.model) {
    throw new Error("LLM config requires apiKey and model");
  }
}

export function assertSearchConfig(config: SearchConfig | GenerateConfig) {
  if (!config.databaseUrl || !config.query) {
    throw new Error("Search config requires databaseUrl and query");
  }
}
