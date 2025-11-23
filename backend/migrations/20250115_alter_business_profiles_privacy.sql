-- Migration: Add privacy + geo fields to business_profiles

ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS is_public_profile boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_dms boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN public.business_profiles.zip_code IS
'Primary ZIP/postal code used for local group filters and discovery';

COMMENT ON COLUMN public.business_profiles.is_public_profile IS
'If false, profile is not listed in public directories and cannot receive unsolicited DMs';

COMMENT ON COLUMN public.business_profiles.allow_dms IS
'If false, user cannot receive any new DM threads except system/admin';

COMMENT ON COLUMN public.business_profiles.avatar_url IS
'Optional avatar image for chat UIs';

