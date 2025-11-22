-- Migration: Add postal_code to business_profiles
-- Allows grouping growers/dispensaries by ZIP/postal code

ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS postal_code text;

COMMENT ON COLUMN public.business_profiles.postal_code
IS 'Postal / ZIP code for grouping local growers and dispensaries';

