import {
  assertChunkingConfig,
  assertEmbeddingConfig,
  readJson,
  withDefaults,
} from "../_shared/config.ts";
import { splitText } from "../_shared/chunking.ts";
import {
  deleteBySourcePaths,
  ensureSchemaAndTable,
  upsertChunks,
} from "../_shared/db.ts";
import { createEmbeddings } from "../_shared/embeddings.ts";
import { downloadDocument } from "../_shared/storage.ts";
import { ReindexConfig } from "../_shared/types.ts";

Deno.serve(async (req) => {
  try {
    const config = withDefaults(await readJson<ReindexConfig>(req));
    assertChunkingConfig(config.chunking);
    assertEmbeddingConfig(config.embedding);

    const embeddings = createEmbeddings(config.embedding);
    const rows: Array<{
      document_id: string;
      source_path: string;
      content: string;
      metadata: Record<string, unknown>;
      embedding: number[];
    }> = [];

    for (const path of config.reindexPaths) {
      const content = await downloadDocument({
        supabaseUrl: config.supabaseUrl,
        supabaseServiceRoleKey: config.supabaseServiceRoleKey,
        bucketName: config.storage.bucketName,
        path,
      });
      const chunks = await splitText(content, config.chunking);
      const vectors = await embeddings.embedDocuments(chunks);

      chunks.forEach((chunk, index) => {
        rows.push({
          document_id: path,
          source_path: path,
          content: chunk,
          metadata: {
            bucket: config.storage.bucketName,
            chunk_index: index,
            chunk_total: chunks.length,
            reindexed_at: new Date().toISOString(),
          },
          embedding: vectors[index],
        });
      });
    }

    const vectorSize = config.vectorSize ?? rows[0]?.embedding.length ?? 0;
    if (!vectorSize) {
      throw new Error("Unable to determine vector size from embeddings.");
    }

    await ensureSchemaAndTable({
      databaseUrl: config.databaseUrl,
      vectorSize,
      schema: config.schema,
      table: config.table,
    });

    await deleteBySourcePaths({
      databaseUrl: config.databaseUrl,
      schema: config.schema,
      table: config.table,
      paths: config.reindexPaths,
    });

    await upsertChunks({
      databaseUrl: config.databaseUrl,
      schema: config.schema,
      table: config.table,
      rows,
    });

    return new Response(
      JSON.stringify({ ok: true, reindexed: config.reindexPaths }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
