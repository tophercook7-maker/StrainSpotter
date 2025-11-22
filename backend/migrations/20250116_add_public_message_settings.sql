-- Migration: Add public message settings to profiles
-- Allows users to control who can message them

ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS allow_public_messages boolean DEFAULT true;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS allow_public_messages boolean DEFAULT true;

COMMENT ON COLUMN public.business_profiles.allow_public_messages IS 'If true, anyone can send DMs. If false, only accepted contacts can message.';
COMMENT ON COLUMN public.profiles.allow_public_messages IS 'If true, anyone can send DMs. If false, only accepted contacts can message.';

