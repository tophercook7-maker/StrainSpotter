-- Migration: Create DM messages table for 1:1 conversations
-- This is separate from the group messages table (messages) from PART 9

CREATE TABLE IF NOT EXISTS public.dm_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body text NOT NULL,
    image_url text,
    image_type text,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_id_created_at
ON public.dm_messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_messages_sender_id
ON public.dm_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_dm_messages_read_at
ON public.dm_messages (read_at);

COMMENT ON TABLE public.dm_messages IS 'Messages in 1:1 DM conversations';
COMMENT ON COLUMN public.dm_messages.read_at IS 'When message was read by recipient (null = unread)';

