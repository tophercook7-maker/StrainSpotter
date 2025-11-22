-- Migration: Tag scans with pro role
-- Enables filtering analytics by dispensary vs grower vs consumer scans

ALTER TABLE public.scans
ADD COLUMN IF NOT EXISTS pro_role text;

CREATE INDEX IF NOT EXISTS idx_scans_pro_role
ON public.scans (pro_role);

COMMENT ON COLUMN public.scans.pro_role IS 'Pro mode role when scan was created: "dispensary" | "grower" | null';

