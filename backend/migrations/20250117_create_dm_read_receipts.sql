-- Migration: Create DM read receipts table for tracking unread messages per user
-- This allows us to efficiently query "unread count per conversation"

CREATE TABLE IF NOT EXISTS public.dm_read_receipts (
    conversation_id uuid NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_message_id uuid REFERENCES public.dm_messages(id) ON DELETE SET NULL,
    last_read_at timestamptz DEFAULT now(),
    unread_count integer DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_read_receipts_user_id
ON public.dm_read_receipts (user_id);

CREATE INDEX IF NOT EXISTS idx_dm_read_receipts_unread_count
ON public.dm_read_receipts (unread_count);

COMMENT ON TABLE public.dm_read_receipts IS 'Tracks read status and unread counts for each user in each DM conversation';
COMMENT ON COLUMN public.dm_read_receipts.unread_count IS 'Cached count of unread messages (can be recalculated)';

