-- Migration: Add city and state to zip_groups for feed posts
-- Note: zip_groups already exists from PART 9 (conversations), we're extending it
ALTER TABLE public.zip_groups
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

COMMENT ON COLUMN public.zip_groups.city IS 'City name for display in feed';
COMMENT ON COLUMN public.zip_groups.state IS 'State name for display in feed';

