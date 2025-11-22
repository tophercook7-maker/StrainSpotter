-- Migration: Add pro role fields to profiles
-- Enables storing dispensary/grower mode per user

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pro_role text,
ADD COLUMN IF NOT EXISTS pro_enabled boolean DEFAULT false;

-- Optional: index for filtering by pro role
CREATE INDEX IF NOT EXISTS idx_profiles_pro_role
ON public.profiles (pro_role);

COMMENT ON COLUMN public.profiles.pro_role IS 'Pro mode role: "dispensary" | "grower" | null';
COMMENT ON COLUMN public.profiles.pro_enabled IS 'Whether pro mode is currently enabled for this user';

