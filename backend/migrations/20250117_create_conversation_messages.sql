-- Migration: Create conversation_messages table for messages inside conversations
-- This is for the group conversations (conversations table from PART 9)
-- Note: This may replace or supplement the existing messages table

CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body text,
    image_url text,
    -- basic read flags (per-recipient)
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_created
ON public.conversation_messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_is_read
ON public.conversation_messages (conversation_id, is_read);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender
ON public.conversation_messages (sender_user_id);

COMMENT ON TABLE public.conversation_messages IS 'Messages inside group conversations (conversations table)';
COMMENT ON COLUMN public.conversation_messages.is_read IS 'Basic read flag (per-recipient tracking can be added later)';

