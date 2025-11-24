-- Create dedicated DM messages table
CREATE TABLE IF NOT EXISTS public.dm_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text text,
    attachments jsonb,
    created_at timestamptz DEFAULT now(),
    is_read boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created
ON public.dm_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_dm_messages_is_read
ON public.dm_messages (conversation_id, is_read);

COMMENT ON TABLE public.dm_messages IS 'Messages in 1:1 DM conversations';
COMMENT ON COLUMN public.dm_messages.attachments IS 'JSONB array: [{type: "image", url: "...", width?: number, height?: number}]';

 ne fine day