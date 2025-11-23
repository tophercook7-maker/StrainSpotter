-- Migration: Add DM fields to conversations table to support both group chats and DMs
-- This allows conversations table to handle both group chats (is_group=true) and DMs (is_group=false)

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS user_a_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_b_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS business_b_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS last_message_text text,
ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- Add constraint: for DMs (is_group=false), must have either user_b_id or business_b_id
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_dm_participants_check;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_dm_participants_check
  CHECK (
    (is_group = true) OR 
    (is_group = false AND (user_b_id IS NOT NULL OR business_b_id IS NOT NULL))
  );

-- Indexes for DM lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_a_id
ON public.conversations (user_a_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_b_id
ON public.conversations (user_b_id);

CREATE INDEX IF NOT EXISTS idx_conversations_business_b_id
ON public.conversations (business_b_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
ON public.conversations (last_message_at DESC NULLS LAST);

COMMENT ON COLUMN public.conversations.user_a_id IS 'First participant for DMs (always a user)';
COMMENT ON COLUMN public.conversations.user_b_id IS 'Second participant for user-user DMs';
COMMENT ON COLUMN public.conversations.business_b_id IS 'Second participant for user-business DMs';
COMMENT ON COLUMN public.conversations.last_message_text IS 'Preview of last message for inbox';
COMMENT ON COLUMN public.conversations.last_message_at IS 'Timestamp of last message for sorting';

