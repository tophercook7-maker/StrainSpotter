-- Migration: Create group_posts table for ZIP-based feed posts
CREATE TABLE IF NOT EXISTS public.group_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES public.zip_groups(id) ON DELETE CASCADE,
    author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
    post_type text CHECK (post_type IN ('deal','drop','update','event','general')) DEFAULT 'general',
    title text,
    body text,
    image_url text,
    strain_slug text,
    scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
    is_pinned boolean DEFAULT false,
    pinned_until timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_posts_group_id_created
ON public.group_posts (group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_posts_strain_slug
ON public.group_posts (strain_slug);

CREATE INDEX IF NOT EXISTS idx_group_posts_business_id
ON public.group_posts (business_id);

CREATE INDEX IF NOT EXISTS idx_group_posts_is_pinned
ON public.group_posts (is_pinned, pinned_until);

COMMENT ON TABLE public.group_posts IS 'Feed posts in ZIP-based groups (deals, drops, events, updates)';
COMMENT ON COLUMN public.group_posts.post_type IS 'Type of post: deal, drop, update, event, general';
COMMENT ON COLUMN public.group_posts.is_pinned IS 'Whether post is pinned (businesses can pin their posts)';
COMMENT ON COLUMN public.group_posts.pinned_until IS 'When pin expires (default 24h)';

