-- Add geolocation fields to dispensaries for proximity search
ALTER TABLE IF EXISTS public.dispensaries
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_dispensaries_state ON public.dispensaries(state);
CREATE INDEX IF NOT EXISTS idx_dispensaries_city ON public.dispensaries(city);
CREATE INDEX IF NOT EXISTS idx_dispensaries_lat ON public.dispensaries(lat);
CREATE INDEX IF NOT EXISTS idx_dispensaries_lng ON public.dispensaries(lng);

COMMENT ON COLUMN public.dispensaries.lat IS 'Latitude (WGS84)';
COMMENT ON COLUMN public.dispensaries.lng IS 'Longitude (WGS84)';
