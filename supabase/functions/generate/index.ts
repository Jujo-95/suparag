import {
  assertEmbeddingConfig,
  assertLlmConfig,
  assertSearchConfig,
  readJson,
  withDefaults,
  withSearchDefaults,
} from "../_shared/config.ts";
import { createEmbeddings } from "../_shared/embeddings.ts";
import { searchChunks } from "../_shared/db.ts";
import { generateAnswer } from "../_shared/rag.ts";
import { GenerateConfig } from "../_shared/types.ts";

Deno.serve(async (req) => {
  try {
    const config = withSearchDefaults(withDefaults(await readJson<GenerateConfig>(req)));
    assertSearchConfig(config);
    assertEmbeddingConfig(config.embedding);
    assertLlmConfig(config.llm);

    const embeddings = createEmbeddings(config.embedding);
    const vector = await embeddings.embedQuery(config.query);
    const matches = await searchChunks({
      databaseUrl: config.databaseUrl,
      schema: config.schema,
      matchFunction: config.matchFunction,
      embedding: vector,
      matchCount: config.matchCount ?? 5,
    });

    const context = matches.map((match) => match.content).join("\n\n");
    const answer = await generateAnswer({
      llm: config.llm,
      question: config.query,
      context,
    });

    return new Response(
      JSON.stringify({ ok: true, answer, matches }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
