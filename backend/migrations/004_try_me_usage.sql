-- Migration: Add try_me_usage table for anonymous trial tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.try_me_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_try_me_usage_identifier ON public.try_me_usage(identifier);
CREATE INDEX IF NOT EXISTS idx_try_me_usage_user_id ON public.try_me_usage(user_id);

COMMENT ON TABLE public.try_me_usage IS 'Tracks trial scan usage per device or user for "Try Me" feature';
COMMENT ON COLUMN public.try_me_usage.identifier IS 'Device ID (anonymous) or user ID for tracking';
COMMENT ON COLUMN public.try_me_usage.user_id IS 'Optional: linked Supabase user ID after signup';
COMMENT ON COLUMN public.try_me_usage.count IS 'Number of scans used (max 2 for trial)';
