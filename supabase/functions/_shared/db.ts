import postgres from "npm:postgres@3.4.4";
import {
  DEFAULT_MATCH_FUNCTION,
  DEFAULT_SCHEMA,
  DEFAULT_TABLE,
} from "./config.ts";

export interface DbConfig {
  databaseUrl: string;
}

export function createDbClient(databaseUrl: string) {
  return postgres(databaseUrl, { ssl: "require" });
}

export async function ensureSchemaAndTable(params: {
  databaseUrl: string;
  vectorSize: number;
  schema?: string;
  table?: string;
  matchFunction?: string;
}) {
  const schema = params.schema ?? DEFAULT_SCHEMA;
  const table = params.table ?? DEFAULT_TABLE;
  const matchFunction = params.matchFunction ?? DEFAULT_MATCH_FUNCTION;
  const sql = createDbClient(params.databaseUrl);

  await sql`create extension if not exists vector`;
  await sql`create schema if not exists ${sql(schema)}`;
  await sql`
    create table if not exists ${sql(schema)}.${sql(table)} (
      id bigserial primary key,
      document_id text not null,
      source_path text not null,
      content text not null,
      metadata jsonb not null default '{}'::jsonb,
      embedding vector(${sql(params.vectorSize)}) not null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create index if not exists ${sql(table + "_embedding_idx")} 
    on ${sql(schema)}.${sql(table)}
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100)
  `;

  await sql`
    create or replace function ${sql(schema)}.${sql(matchFunction)}(
      query_embedding vector(${sql(params.vectorSize)}),
      match_count int,
      filter jsonb default '{}'::jsonb
    )
    returns table (
      id bigint,
      document_id text,
      source_path text,
      content text,
      metadata jsonb,
      similarity float
    )
    language sql stable
    as $$
      select
        id,
        document_id,
        source_path,
        content,
        metadata,
        1 - (embedding <=> query_embedding) as similarity
      from ${schema}.${table}
      where metadata @> filter
      order by embedding <=> query_embedding
      limit match_count;
    $$;
  `;

  await sql.end({ timeout: 5 });
}

export async function upsertChunks(params: {
  databaseUrl: string;
  schema?: string;
  table?: string;
  rows: Array<{
    document_id: string;
    source_path: string;
    content: string;
    metadata: Record<string, unknown>;
    embedding: number[];
  }>;
}) {
  if (!params.rows.length) return;
  const schema = params.schema ?? DEFAULT_SCHEMA;
  const table = params.table ?? DEFAULT_TABLE;
  const sql = createDbClient(params.databaseUrl);

  await sql`
    insert into ${sql(schema)}.${sql(table)}
      (document_id, source_path, content, metadata, embedding)
    values ${sql(
      params.rows.map((row) => [
        row.document_id,
        row.source_path,
        row.content,
        row.metadata,
        row.embedding,
      ]),
    )}
  `;

  await sql.end({ timeout: 5 });
}

export async function searchChunks(params: {
  databaseUrl: string;
  schema?: string;
  matchFunction?: string;
  embedding: number[];
  matchCount: number;
}) {
  const schema = params.schema ?? DEFAULT_SCHEMA;
  const matchFunction = params.matchFunction ?? DEFAULT_MATCH_FUNCTION;
  const sql = createDbClient(params.databaseUrl);
  const result = await sql`
    select * from ${sql(schema)}.${sql(matchFunction)}(
      ${params.embedding},
      ${params.matchCount}
    )
  `;
  await sql.end({ timeout: 5 });
  return result;
}

export async function deleteBySourcePaths(params: {
  databaseUrl: string;
  schema?: string;
  table?: string;
  paths: string[];
}) {
  if (!params.paths.length) return;
  const schema = params.schema ?? DEFAULT_SCHEMA;
  const table = params.table ?? DEFAULT_TABLE;
  const sql = createDbClient(params.databaseUrl);
  await sql`
    delete from ${sql(schema)}.${sql(table)}
    where source_path = any(${params.paths})
  `;
  await sql.end({ timeout: 5 });
}
