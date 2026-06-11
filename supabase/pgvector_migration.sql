-- ============================================================================
-- DiligenceAI — pgvector vector store
-- Run this in the Supabase SQL Editor. Replaces the local Chroma store so the
-- backend has no heavyweight in-memory vector DB (fixes OOM on small hosts) and
-- no ephemeral local disk (vectors persist in Postgres).
--
-- Embedding dimension is 3072 (Google gemini embedding). 3072 > pgvector's
-- 2000-dim ANN-index limit, so we do exact KNN filtered per session — fast at
-- this scale. No ivfflat/hnsw index is created (and none is needed here).
-- ============================================================================

create extension if not exists vector;

create table if not exists public.document_embeddings (
  id        uuid primary key default gen_random_uuid(),
  content   text,
  metadata  jsonb,
  embedding vector(3072)
);

-- Speeds up the per-session metadata filter used on every search.
create index if not exists document_embeddings_metadata_idx
  on public.document_embeddings using gin (metadata);

-- Backend talks to this table only via the service-role key (which bypasses
-- RLS), so enable RLS with no policies to keep it inaccessible to anon clients.
alter table public.document_embeddings enable row level security;

-- LangChain-compatible similarity search RPC.
create or replace function public.match_document_embeddings(
  query_embedding vector(3072),
  match_count int default 6,
  filter jsonb default '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
begin
  return query
  select
    de.id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  from public.document_embeddings de
  where de.metadata @> filter
  order by de.embedding <=> query_embedding
  limit match_count;
end;
$$;
