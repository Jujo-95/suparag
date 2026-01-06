import {
  assertEmbeddingConfig,
  assertSearchConfig,
  readJson,
  withDefaults,
  withSearchDefaults,
} from "../_shared/config.ts";
import { createEmbeddings } from "../_shared/embeddings.ts";
import { searchChunks } from "../_shared/db.ts";
import { SearchConfig } from "../_shared/types.ts";

Deno.serve(async (req) => {
  try {
    const config = withSearchDefaults(withDefaults(await readJson<SearchConfig>(req)));
    assertSearchConfig(config);
    assertEmbeddingConfig(config.embedding);

    const embeddings = createEmbeddings(config.embedding);
    const vector = await embeddings.embedQuery(config.query);
    const matches = await searchChunks({
      databaseUrl: config.databaseUrl,
      schema: config.schema,
      matchFunction: config.matchFunction,
      embedding: vector,
      matchCount: config.matchCount ?? 5,
    });

    return new Response(JSON.stringify({ ok: true, matches }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
