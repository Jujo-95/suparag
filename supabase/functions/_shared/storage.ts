import { createClient } from "npm:@supabase/supabase-js@2";
import { SupabaseConfig } from "./types.ts";

export function createSupabaseClient(config: SupabaseConfig) {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function ensureBucket(params: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  bucketName: string;
  publicBucket?: boolean;
}) {
  const client = createSupabaseClient({
    supabaseUrl: params.supabaseUrl,
    supabaseServiceRoleKey: params.supabaseServiceRoleKey,
    databaseUrl: "",
  });

  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;
  const exists = buckets.some((bucket) => bucket.name === params.bucketName);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(
      params.bucketName,
      { public: params.publicBucket ?? false },
    );
    if (createError) throw createError;
  }
}

export async function listDocuments(params: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  bucketName: string;
  prefix?: string;
}) {
  const client = createSupabaseClient({
    supabaseUrl: params.supabaseUrl,
    supabaseServiceRoleKey: params.supabaseServiceRoleKey,
    databaseUrl: "",
  });

  const { data, error } = await client.storage
    .from(params.bucketName)
    .list(params.prefix ?? "", { limit: 1000 });
  if (error) throw error;
  return data
    .filter((item) => item.name && item.id)
    .map((item) => (params.prefix ? `${params.prefix}/${item.name}` : item.name));
}

export async function downloadDocument(params: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  bucketName: string;
  path: string;
}) {
  const client = createSupabaseClient({
    supabaseUrl: params.supabaseUrl,
    supabaseServiceRoleKey: params.supabaseServiceRoleKey,
    databaseUrl: "",
  });

  const { data, error } = await client.storage
    .from(params.bucketName)
    .download(params.path);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  return new TextDecoder().decode(arrayBuffer);
}
