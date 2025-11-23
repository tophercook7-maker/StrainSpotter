-- 20250116_add_missing_scan_columns.sql
-- Add missing scan columns used by backend code:
-- - matched_strain_name
-- - match_confidence
-- - match_quality
-- - error
-- - ai_summary
-- - pro_role
-- Also re-assert canonical_* columns (IF NOT EXISTS is safe)

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS matched_strain_name text,
  ADD COLUMN IF NOT EXISTS match_confidence double precision,
  ADD COLUMN IF NOT EXISTS match_quality text,
  ADD COLUMN IF NOT EXISTS error jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary jsonb,
  ADD COLUMN IF NOT EXISTS pro_role text;

-- Canonical strain columns (in case they weren't applied here yet)
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS canonical_strain_name text,
  ADD COLUMN IF NOT EXISTS canonical_strain_source text,
  ADD COLUMN IF NOT EXISTS canonical_match_confidence double precision;

-- Optional index for canonical strain analytics
CREATE INDEX IF NOT EXISTS idx_scans_canonical_strain_name
  ON public.scans (canonical_strain_name);

COMMENT ON COLUMN public.scans.matched_strain_name IS 'Legacy matched strain name (pre-canonical)';
COMMENT ON COLUMN public.scans.match_confidence IS 'Legacy confidence score (0–1)';
COMMENT ON COLUMN public.scans.match_quality IS 'Legacy match quality label (e.g., high/medium/low)';
COMMENT ON COLUMN public.scans.error IS 'Structured error payload for scan processing';
COMMENT ON COLUMN public.scans.ai_summary IS 'Structured AI summary JSON for the scan';
COMMENT ON COLUMN public.scans.pro_role IS 'Optional pro mode role or flag for this scan';
COMMENT ON COLUMN public.scans.canonical_strain_name IS 'Canonical strain name chosen by the pipeline';
COMMENT ON COLUMN public.scans.canonical_strain_source IS 'Source of canonical strain (packaging | visual | none)';
COMMENT ON COLUMN public.scans.canonical_match_confidence IS 'Confidence score for canonical strain (0–1)';

