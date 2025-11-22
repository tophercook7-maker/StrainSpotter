-- Migration: Add image support to group messages
-- Enables image sharing in group chats

-- Check if geo_group_messages table exists (it might be named differently)
-- If it doesn't exist, this will be a no-op
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'geo_group_messages'
    ) THEN
        ALTER TABLE public.geo_group_messages
        ADD COLUMN IF NOT EXISTS image_url text,
        ADD COLUMN IF NOT EXISTS image_width integer,
        ADD COLUMN IF NOT EXISTS image_height integer;
    END IF;
END $$;

COMMENT ON COLUMN public.geo_group_messages.image_url IS 'URL to image attachment in Supabase Storage (chat_images bucket)';
COMMENT ON COLUMN public.geo_group_messages.image_width IS 'Image width in pixels';
COMMENT ON COLUMN public.geo_group_messages.image_height IS 'Image height in pixels';

