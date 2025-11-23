-- Migration: Create messages table for chat system
-- Messages in a conversation with read tracking

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    message_text text,
    image_url text,
    created_at timestamptz DEFAULT now(),
    read_by uuid[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created_at
ON public.chat_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id
ON public.chat_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_read_by
ON public.chat_messages USING GIN (read_by);

COMMENT ON TABLE public.chat_messages IS 'Messages in conversations (DMs and groups)';
COMMENT ON COLUMN public.chat_messages.read_by IS 'Array of user IDs who have read this message';

