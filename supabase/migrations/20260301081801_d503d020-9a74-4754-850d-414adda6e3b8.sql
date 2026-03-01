
-- Move vector extension to extensions schema (drop dependent column first, recreate after)
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER TABLE public.embeddings DROP COLUMN vector;
DROP EXTENSION vector;
CREATE EXTENSION vector SCHEMA extensions;
ALTER TABLE public.embeddings ADD COLUMN vector extensions.vector(768);
