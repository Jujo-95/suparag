import {
  assertChunkingConfig,
  assertEmbeddingConfig,
  readJson,
  withDefaults,
} from "../_shared/config.ts";
import { splitText } from "../_shared/chunking.ts";
import { ensureSchemaAndTable, upsertChunks } from "../_shared/db.ts";
import { createEmbeddings } from "../_shared/embeddings.ts";
import {
  downloadDocument,
  listDocuments,
} from "../_shared/storage.ts";
import { IngestConfig } from "../_shared/types.ts";

Deno.serve(async (req) => {
  try {
    const config = withDefaults(await readJson<IngestConfig>(req));

    assertChunkingConfig(config.chunking);
    assertEmbeddingConfig(config.embedding);

    const paths = config.storage.paths ??
      await listDocuments({
        supabaseUrl: config.supabaseUrl,
        supabaseServiceRoleKey: config.supabaseServiceRoleKey,
        bucketName: config.storage.bucketName,
        prefix: config.storage.prefix,
      });

    const embeddings = createEmbeddings(config.embedding);
    const rows: Array<{
      document_id: string;
      source_path: string;
      content: string;
      metadata: Record<string, unknown>;
      embedding: number[];
    }> = [];

    for (const path of paths) {
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

    await upsertChunks({
      databaseUrl: config.databaseUrl,
      schema: config.schema,
      table: config.table,
      rows,
    });

    return new Response(
      JSON.stringify({ ok: true, chunks: rows.length, documents: paths.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
