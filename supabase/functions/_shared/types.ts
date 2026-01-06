export type ChunkingStrategy = "recursive" | "character";

export interface ChunkingConfig {
  strategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
}

export type EmbeddingProvider = "openai" | "google";
export type LlmProvider = "openai" | "google";

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey: string;
  model: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  temperature?: number;
}

export interface StorageConfig {
  bucketName: string;
  prefix?: string;
  paths?: string[];
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  databaseUrl: string;
}

export interface SetupConfig extends SupabaseConfig {
  vectorSize: number;
  schema?: string;
  table?: string;
  matchFunction?: string;
  bucket?: {
    name: string;
    public?: boolean;
  };
}

export interface IngestConfig extends SupabaseConfig {
  schema?: string;
  table?: string;
  vectorSize?: number;
  chunking: ChunkingConfig;
  embedding: EmbeddingConfig;
  storage: StorageConfig;
}

export interface SearchConfig {
  databaseUrl: string;
  schema?: string;
  table?: string;
  matchFunction?: string;
  embedding: EmbeddingConfig;
  query: string;
  matchCount?: number;
}

export interface GenerateConfig extends SearchConfig {
  llm: LlmConfig;
}

export interface ReindexConfig extends IngestConfig {
  reindexPaths: string[];
}

export interface ChunkRow {
  id: number;
  document_id: string;
  source_path: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}
