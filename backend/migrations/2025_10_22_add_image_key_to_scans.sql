-- Add image_key column to scans for signed URL support
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS image_key text;

-- Optional: index for fast lookup
CREATE INDEX IF NOT EXISTS idx_scans_image_key ON public.scans(image_key);

COMMENT ON COLUMN public.scans.image_key IS 'Supabase Storage object key (users/{owner}/{filename})';
