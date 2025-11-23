-- Migration: Create chat_group_members table for group membership tracking
-- Users join groups (zip, global, interest) and can have roles

CREATE TABLE IF NOT EXISTS public.chat_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- later we can add roles: 'owner','moderator','member'
    role text DEFAULT 'member',
    
    joined_at timestamptz DEFAULT now(),
    
    UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id
ON public.chat_group_members (group_id);

CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id
ON public.chat_group_members (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_group_members_role
ON public.chat_group_members (role);

COMMENT ON TABLE public.chat_group_members IS 'Membership in chat groups (zip, global, interest)';
COMMENT ON COLUMN public.chat_group_members.role IS 'Member role: owner, moderator, or member (for future use)';

