-- Migration: Create zip_groups table for automatic ZIP-based group conversations
CREATE TABLE IF NOT EXISTS public.zip_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code text NOT NULL,
    country text DEFAULT 'US',
    conversation_id uuid REFERENCES public.conversations (id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (zip_code, country)
);

CREATE INDEX IF NOT EXISTS idx_zip_groups_zip_country
ON public.zip_groups (zip_code, country);

CREATE INDEX IF NOT EXISTS idx_zip_groups_conversation
ON public.zip_groups (conversation_id);

COMMENT ON TABLE public.zip_groups IS 'Maps ZIP codes to group conversations for automatic local chat rooms.';

