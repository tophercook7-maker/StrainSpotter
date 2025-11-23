-- Migration: Create geo_group_neighbors for cross-ZIP grouping

CREATE TABLE IF NOT EXISTS public.geo_group_neighbors (
    zip_code text NOT NULL,
    neighbor_zip text NOT NULL,
    distance_km numeric,
    PRIMARY KEY (zip_code, neighbor_zip)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_geo_group_neighbors_zip
ON public.geo_group_neighbors (zip_code);

CREATE INDEX IF NOT EXISTS idx_geo_group_neighbors_neighbor_zip
ON public.geo_group_neighbors (neighbor_zip);

COMMENT ON TABLE public.geo_group_neighbors IS
'Defines which zip codes are considered nearby for merged group feeds';

COMMENT ON COLUMN public.geo_group_neighbors.distance_km IS
'Approximate distance between zip_code and neighbor_zip';

------------------------------------------------------
-- OPTIONAL: Seed a few neighbors manually for testing
------------------------------------------------------
INSERT INTO public.geo_group_neighbors (zip_code, neighbor_zip, distance_km)
VALUES
  ('72201', '72202', 3.0),
  ('72201', '72204', 7.0),
  ('72201', '72120', 12.0),
  ('72202', '72201', 3.0),
  ('72204', '72201', 7.0)
ON CONFLICT (zip_code, neighbor_zip) DO NOTHING;

