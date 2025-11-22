-- Migration: Add canonical strain columns to scans

-- Purpose:
--   Store the resolved "canonical" strain on each scan so the frontend
--   and analytics can rely on a single, trusted strain name and source.
--
-- Notes:
--   - canonical_strain_name: final chosen strain name ("SCOTT'S OG", "Glitter Bomb", etc.)
--   - canonical_strain_source: where the name came from ("packaging", "visual", "none")
--   - canonical_match_confidence: 0.0–1.0 confidence score for the canonical choice
--
-- Safe to run multiple times because of IF NOT EXISTS.

ALTER TABLE public.scans
ADD COLUMN IF NOT EXISTS canonical_strain_name text,
ADD COLUMN IF NOT EXISTS canonical_strain_source text,
ADD COLUMN IF NOT EXISTS canonical_match_confidence double precision;

-- Optional: index to speed up queries by canonical strain name
-- (helpful for analytics, history, etc.)
CREATE INDEX IF NOT EXISTS idx_scans_canonical_strain_name
  ON public.scans (canonical_strain_name);

