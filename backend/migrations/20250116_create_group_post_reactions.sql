-- Migration: Create group_post_reactions table for likes, saves, etc.
CREATE TABLE IF NOT EXISTS public.group_post_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type text CHECK (reaction_type IN ('like','fire','save')) DEFAULT 'like',
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_group_post_reactions_post_id
ON public.group_post_reactions (post_id);

CREATE INDEX IF NOT EXISTS idx_group_post_reactions_user_id
ON public.group_post_reactions (user_id);

COMMENT ON TABLE public.group_post_reactions IS 'User reactions to group posts (likes, fire, saves)';

