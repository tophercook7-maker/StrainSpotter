-- Migration: Create messages table for conversations (DMs + groups)
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.conversations (id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    body text NOT NULL,
    -- later: attachment_url text, attachment_type text, strain_slug text, etc.
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON public.messages (sender_id);

COMMENT ON TABLE public.messages IS 'Messages inside conversations (DMs + groups).';

