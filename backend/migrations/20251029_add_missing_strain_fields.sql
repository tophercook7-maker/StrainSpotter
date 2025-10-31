-- Migration: Add missing fields to strains table for full frontend/backend compatibility
ALTER TABLE public.strains
  ADD COLUMN IF NOT EXISTS indica_percent float,
  ADD COLUMN IF NOT EXISTS sativa_percent float,
  ADD COLUMN IF NOT EXISTS medical text[],
  ADD COLUMN IF NOT EXISTS confidence int,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS breeder text,
  ADD COLUMN IF NOT EXISTS reviews jsonb;

-- Optional: update column names for consistency
ALTER TABLE public.strains
  RENAME COLUMN seed_sources TO seed_vendors;
ALTER TABLE public.strains
  RENAME COLUMN grow_guide TO grow_tips;

-- Note: lab_test_results, seed_vendors, grow_tips, reviews are jsonb for flexibility
-- Run this migration in Supabase SQL editor or via CLI
