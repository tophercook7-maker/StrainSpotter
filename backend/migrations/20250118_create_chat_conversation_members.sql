-- Migration: Create conversation_members table for chat system
-- Members in a conversation (DM or group)

CREATE TABLE IF NOT EXISTS public.chat_conversation_members (
    conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin boolean DEFAULT false,
    joined_at timestamptz DEFAULT now(),
    PRIMARY KEY(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversation_members_conversation_id
ON public.chat_conversation_members (conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversation_members_user_id
ON public.chat_conversation_members (user_id);

COMMENT ON TABLE public.chat_conversation_members IS 'Membership in conversations (DMs and groups)';
COMMENT ON COLUMN public.chat_conversation_members.is_admin IS 'Admin role for group moderation';

