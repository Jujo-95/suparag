# suparag

Framework MVP para un sistema RAG completo en Supabase usando Edge Functions y LangChain.

## Qué incluye el MVP

- **Setup**: crea esquema `suparag`, tabla de chunks, índice vectorial e función `match_chunks`.
- **Storage**: crea o reutiliza buckets de Supabase Storage.
- **Ingest**: descarga documentos del bucket, hace chunking, embeddings y guarda vectores.
- **Search**: busca chunks similares con embeddings.
- **Reindex**: reindexa documentos específicos (elimina + inserta).
- **Generate**: RAG básico que recupera contexto y genera respuesta con un LLM.

## Requisitos

- Supabase Project (URL + Service Role Key)
- `DATABASE_URL` (Postgres connection string de Supabase)
- Credenciales del proveedor de embeddings/LLM (OpenAI o Google)

## Estructura

```
supabase/functions
  ├─ setup
  ├─ ingest
  ├─ search
  ├─ reindex
  └─ generate
```

## Configuración de ejemplo

### 1) Setup

```bash
curl -X POST $SUPABASE_FUNCTION_URL/setup \
  -H 'Content-Type: application/json' \
  -d '{
    "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
    "supabaseServiceRoleKey": "YOUR_SERVICE_ROLE_KEY",
    "databaseUrl": "postgres://...",
    "vectorSize": 1536,
    "schema": "suparag",
    "table": "chunks",
    "matchFunction": "match_chunks",
    "bucket": { "name": "rag-docs", "public": false }
  }'
```

### 2) Ingest (OpenAI o Google)

```bash
curl -X POST $SUPABASE_FUNCTION_URL/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
    "supabaseServiceRoleKey": "YOUR_SERVICE_ROLE_KEY",
    "databaseUrl": "postgres://...",
    "chunking": { "strategy": "recursive", "chunkSize": 800, "chunkOverlap": 120 },
    "embedding": { "provider": "openai", "apiKey": "OPENAI_KEY", "model": "text-embedding-3-small" },
    "storage": { "bucketName": "rag-docs", "prefix": "docs" }
  }'
```

```bash
curl -X POST $SUPABASE_FUNCTION_URL/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
    "supabaseServiceRoleKey": "YOUR_SERVICE_ROLE_KEY",
    "databaseUrl": "postgres://...",
    "chunking": { "strategy": "recursive", "chunkSize": 800, "chunkOverlap": 120 },
    "embedding": { "provider": "google", "apiKey": "GOOGLE_API_KEY", "model": "text-embedding-004" },
    "storage": { "bucketName": "rag-docs", "prefix": "docs" }
  }'
```

### 3) Search

```bash
curl -X POST $SUPABASE_FUNCTION_URL/search \
  -H 'Content-Type: application/json' \
  -d '{
    "databaseUrl": "postgres://...",
    "embedding": { "provider": "openai", "apiKey": "OPENAI_KEY", "model": "text-embedding-3-small" },
    "query": "¿Qué es Supabase?",
    "matchCount": 5
  }'
```

```bash
curl -X POST $SUPABASE_FUNCTION_URL/search \
  -H 'Content-Type: application/json' \
  -d '{
    "databaseUrl": "postgres://...",
    "embedding": { "provider": "google", "apiKey": "GOOGLE_API_KEY", "model": "text-embedding-004" },
    "query": "¿Qué es Supabase?",
    "matchCount": 5
  }'
```

### 4) Reindex

```bash
curl -X POST $SUPABASE_FUNCTION_URL/reindex \
  -H 'Content-Type: application/json' \
  -d '{
    "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
    "supabaseServiceRoleKey": "YOUR_SERVICE_ROLE_KEY",
    "databaseUrl": "postgres://...",
    "chunking": { "strategy": "recursive", "chunkSize": 800, "chunkOverlap": 120 },
    "embedding": { "provider": "openai", "apiKey": "OPENAI_KEY", "model": "text-embedding-3-small" },
    "storage": { "bucketName": "rag-docs" },
    "reindexPaths": ["docs/manual.txt", "docs/faq.txt"]
  }'
```

```bash
curl -X POST $SUPABASE_FUNCTION_URL/reindex \
  -H 'Content-Type: application/json' \
  -d '{
    "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
    "supabaseServiceRoleKey": "YOUR_SERVICE_ROLE_KEY",
    "databaseUrl": "postgres://...",
    "chunking": { "strategy": "recursive", "chunkSize": 800, "chunkOverlap": 120 },
    "embedding": { "provider": "google", "apiKey": "GOOGLE_API_KEY", "model": "text-embedding-004" },
    "storage": { "bucketName": "rag-docs" },
    "reindexPaths": ["docs/manual.txt", "docs/faq.txt"]
  }'
```

### 5) Generate (OpenAI o Google)

```bash
curl -X POST $SUPABASE_FUNCTION_URL/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "databaseUrl": "postgres://...",
    "embedding": { "provider": "openai", "apiKey": "OPENAI_KEY", "model": "text-embedding-3-small" },
    "llm": { "provider": "openai", "apiKey": "OPENAI_KEY", "model": "gpt-4o-mini" },
    "query": "Resume el manual de onboarding"
  }'
```

```bash
curl -X POST $SUPABASE_FUNCTION_URL/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "databaseUrl": "postgres://...",
    "embedding": { "provider": "google", "apiKey": "GOOGLE_API_KEY", "model": "text-embedding-004" },
    "llm": { "provider": "google", "apiKey": "GOOGLE_API_KEY", "model": "gemini-1.5-flash" },
    "query": "Resume el manual de onboarding"
  }'
```

## Qué más necesitas para hacerlo realidad

- **Credenciales**: `supabaseUrl`, `supabaseServiceRoleKey`, `databaseUrl`.
- **Bucket**: nombre del bucket existente o a crear.
- **Documentos**: rutas o prefijo dentro del bucket.
- **Embeddings**: proveedor (OpenAI o Google), modelo y API key.
- **LLM**: proveedor (OpenAI o Google), modelo, temperatura y API key.
- **Chunking**: estrategia, tamaño y overlap.

Si me confirmas estos valores, puedo dejar los scripts listos para tu entorno.
