CREATE OR REPLACE FUNCTION public.match_profiles(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  exclude_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.user_id,
    1 - (e.vector OPERATOR(extensions.<=>) query_embedding) AS similarity
  FROM public.embeddings e
  WHERE e.user_id != COALESCE(exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND 1 - (e.vector OPERATOR(extensions.<=>) query_embedding) > match_threshold
  ORDER BY e.vector OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
$$;

CREATE INDEX IF NOT EXISTS embeddings_vector_hnsw_idx
  ON public.embeddings
  USING hnsw (vector extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);