-- Migration: Create unified conversations table for DM and group chats
-- This is a simplified version that works for both DMs and groups

CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group boolean DEFAULT false,
    name text, -- only for groups
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by
ON public.chat_conversations (created_by);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_is_group
ON public.chat_conversations (is_group);

COMMENT ON TABLE public.chat_conversations IS 'Unified conversations table for DMs and group chats';
COMMENT ON COLUMN public.chat_conversations.is_group IS 'true = group chat, false = 1:1 DM';
COMMENT ON COLUMN public.chat_conversations.name IS 'Display name for group chats (null for DMs)';

