-- Migration: Create business_profiles table for growers and dispensaries
-- Each grower/dispensary gets ONE profile linked to auth.users via user_id

CREATE TABLE IF NOT EXISTS public.business_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    business_type text CHECK (business_type IN ('grower','dispensary')),
    business_code text UNIQUE,
    name text,
    city text,
    state text,
    country text,
    phone text,
    website text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by code
CREATE INDEX IF NOT EXISTS idx_business_profiles_code
ON public.business_profiles (business_code);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id
ON public.business_profiles (user_id);

COMMENT ON TABLE public.business_profiles IS 'Profiles for growers and dispensaries with unique business codes';
COMMENT ON COLUMN public.business_profiles.business_code IS 'Unique 4-character code (e.g., A1B9, C47X) for easy sharing';

