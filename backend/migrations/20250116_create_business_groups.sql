-- Migration: Create business_groups for local networks
-- Each row represents a logical group (ZIP, state, metro, etc.)

CREATE TABLE IF NOT EXISTS public.business_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text CHECK (type IN ('zip','state','metro')) NOT NULL,
    key text UNIQUE,
    name text,
    city text,
    state text,
    country text,
    created_at timestamptz DEFAULT now()
);

-- Index for common lookups by type+key
CREATE INDEX IF NOT EXISTS idx_business_groups_type_key
ON public.business_groups (type, key);

COMMENT ON TABLE public.business_groups IS
'Logical groups for business discovery (zip/state/metro). For v1 we use type=zip, key=ZIP:COUNTRY.';

-- Migration: Create business_group_memberships
-- Links a business_profile to one or more business_groups

CREATE TABLE IF NOT EXISTS public.business_group_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    group_id uuid REFERENCES public.business_groups(id) ON DELETE CASCADE,
    role text CHECK (role IN ('owner','member')) DEFAULT 'member',
    created_at timestamptz DEFAULT now(),
    UNIQUE (business_profile_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_business_group_memberships_profile
ON public.business_group_memberships (business_profile_id);

CREATE INDEX IF NOT EXISTS idx_business_group_memberships_group
ON public.business_group_memberships (group_id);

COMMENT ON TABLE public.business_group_memberships IS
'Membership of business_profiles in business_groups (zip, state, metro).';

