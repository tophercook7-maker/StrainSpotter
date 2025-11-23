-- Migration: Create chat_group_messages table for messages in group chats
-- Messages inside ZIP groups, global rooms, and interest-based groups

CREATE TABLE IF NOT EXISTS public.chat_group_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    body text,
    image_url text,
    
    -- pinned by business or moderator
    is_pinned boolean DEFAULT false,
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_group_messages_group_id_created
ON public.chat_group_messages (group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_group_messages_group_id_pinned
ON public.chat_group_messages (group_id, is_pinned);

CREATE INDEX IF NOT EXISTS idx_chat_group_messages_sender
ON public.chat_group_messages (sender_user_id);

COMMENT ON TABLE public.chat_group_messages IS 'Messages in group chats (ZIP groups, global rooms, interest groups)';
COMMENT ON COLUMN public.chat_group_messages.is_pinned IS 'If true, message is pinned by business or moderator (shows at top)';

