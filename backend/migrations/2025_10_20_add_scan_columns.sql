-- Add missing columns to scans table for Vision API processing
-- Run this if you used 2025_create_full_schema.sql which didn't include these fields

-- Add status column
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Add result column for Vision API response
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS result jsonb;

-- Add processed_at timestamp
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Add index for faster recent queries
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON public.scans (created_at DESC);

-- Ensure RLS policies exist (idempotent)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS scans_select_all ON public.scans;
DROP POLICY IF EXISTS scans_insert_all ON public.scans;
DROP POLICY IF EXISTS scans_update_all ON public.scans;

CREATE POLICY scans_select_all ON public.scans FOR SELECT USING (true);
CREATE POLICY scans_insert_all ON public.scans FOR INSERT WITH CHECK (true);
CREATE POLICY scans_update_all ON public.scans FOR UPDATE USING (true);
