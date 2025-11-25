-- Migration: Create strain_images table for reference photos
-- Purpose: Store hero images for strains scraped from seed bank URLs

CREATE TABLE IF NOT EXISTS public.strain_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_name text NOT NULL,
  seed_bank_name text,
  seed_bank_url text,
  image_url text NOT NULL,
  source text DEFAULT 'seed-vendor',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(canonical_name)
);

-- Index for fast lookups by canonical name
CREATE INDEX IF NOT EXISTS idx_strain_images_canonical_name
  ON public.strain_images (canonical_name);

-- Index for seed bank lookups
CREATE INDEX IF NOT EXISTS idx_strain_images_seed_bank_url
  ON public.strain_images (seed_bank_url);

COMMENT ON TABLE public.strain_images IS 'Reference images for strains, scraped from seed bank vendor pages';
COMMENT ON COLUMN public.strain_images.canonical_name IS 'Normalized canonical strain name (e.g., "SCOTT\'S OG")';
COMMENT ON COLUMN public.strain_images.image_url IS 'URL to the hero image (from vendor page or uploaded copy)';
COMMENT ON COLUMN public.strain_images.source IS 'Source of the image (e.g., "seed-vendor", "uploaded", "manual")';

