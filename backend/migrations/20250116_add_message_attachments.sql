-- Migration: Add attachment and strain reference columns to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text,
ADD COLUMN IF NOT EXISTS strain_slug text,
ADD COLUMN IF NOT EXISTS scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_strain_slug
ON public.messages (strain_slug);

CREATE INDEX IF NOT EXISTS idx_messages_scan_id
ON public.messages (scan_id);

COMMENT ON COLUMN public.messages.attachment_url IS 'URL to media attachment (image, etc.) in Supabase Storage';
COMMENT ON COLUMN public.messages.attachment_type IS 'MIME type of attachment (e.g., image/jpeg, image/png)';
COMMENT ON COLUMN public.messages.strain_slug IS 'Reference to a strain from the strains table';
COMMENT ON COLUMN public.messages.scan_id IS 'Reference to a scan result';

