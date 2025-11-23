-- Migration: Create conversation_members table for DM and group chat membership
CREATE TABLE IF NOT EXISTS public.conversation_members (
    conversation_id uuid REFERENCES public.conversations (id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
    role text CHECK (role IN ('owner', 'moderator', 'member')) DEFAULT 'member',
    joined_at timestamptz DEFAULT now(),
    last_read_at timestamptz,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user
ON public.conversation_members (user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation
ON public.conversation_members (conversation_id);

COMMENT ON TABLE public.conversation_members IS 'Membership for DMs and group chats.';

