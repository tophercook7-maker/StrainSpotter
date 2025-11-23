-- Migration: Create conversations table for DMs and group chats
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group boolean NOT NULL DEFAULT false,
    slug text UNIQUE, -- e.g., 'zip-72204', 'zip-72204-growers', null for pure DMs
    title text,       -- Display name for groups (e.g., '72204 — Local StrainTalk')
    description text,
    created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_slug
ON public.conversations (slug);

COMMENT ON TABLE public.conversations IS 'DMs and group chats for StrainSpotter';
COMMENT ON COLUMN public.conversations.is_group IS 'true = group chat, false = 1:1 DM';

