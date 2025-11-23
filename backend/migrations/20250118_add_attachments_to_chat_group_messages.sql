-- Add attachments JSONB column to chat_group_messages for storing multiple attachments
ALTER TABLE public.chat_group_messages
ADD COLUMN IF NOT EXISTS attachments jsonb;

CREATE INDEX IF NOT EXISTS idx_chat_group_messages_attachments
ON public.chat_group_messages USING gin (attachments);

COMMENT ON COLUMN public.chat_group_messages.attachments IS 'JSONB array of attachment objects: [{type: "image", url: "...", width?: number, height?: number}]';

