-- Migration: Create geo_group_messages for local ZIP chat

CREATE TABLE IF NOT EXISTS public.geo_group_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    message text,
    image_url text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_group_messages_zip_created
ON public.geo_group_messages (zip_code, created_at DESC);

COMMENT ON TABLE public.geo_group_messages IS
'Geo-based group chat messages, typically by ZIP code';

