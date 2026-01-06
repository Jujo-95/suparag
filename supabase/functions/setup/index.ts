import { readJson, withDefaults, withSearchDefaults } from "../_shared/config.ts";
import { ensureSchemaAndTable } from "../_shared/db.ts";
import { ensureBucket } from "../_shared/storage.ts";
import { SetupConfig } from "../_shared/types.ts";

Deno.serve(async (req) => {
  try {
    const config = await readJson<SetupConfig>(req);
    const withDefaultsConfig = withDefaults(withSearchDefaults(config));

    await ensureSchemaAndTable({
      databaseUrl: config.databaseUrl,
      vectorSize: config.vectorSize,
      schema: withDefaultsConfig.schema,
      table: withDefaultsConfig.table,
      matchFunction: withDefaultsConfig.matchFunction,
    });

    if (config.bucket) {
      await ensureBucket({
        supabaseUrl: config.supabaseUrl,
        supabaseServiceRoleKey: config.supabaseServiceRoleKey,
        bucketName: config.bucket.name,
        publicBucket: config.bucket.public,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        schema: withDefaultsConfig.schema,
        table: withDefaultsConfig.table,
        matchFunction: withDefaultsConfig.matchFunction,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
