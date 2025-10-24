-- Fix scans table to allow NULL user_id and remove foreign key constraint
-- This allows scans to work without requiring users table entries

-- Drop the foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'scans_user_id_fkey' 
    AND table_name = 'scans'
  ) THEN
    ALTER TABLE public.scans DROP CONSTRAINT scans_user_id_fkey;
  END IF;
END $$;

-- Make user_id nullable if it isn't already
ALTER TABLE public.scans ALTER COLUMN user_id DROP NOT NULL;

-- Add matched_strain_slug if not exists (for saving visual match results)
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS matched_strain_slug text;

-- Ensure RLS policies are permissive for development
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scans_select_all ON public.scans;
DROP POLICY IF EXISTS scans_insert_all ON public.scans;
DROP POLICY IF EXISTS scans_update_all ON public.scans;

-- Allow all operations for now (tighten in production)
CREATE POLICY scans_select_all ON public.scans FOR SELECT USING (true);
CREATE POLICY scans_insert_all ON public.scans FOR INSERT WITH CHECK (true);
CREATE POLICY scans_update_all ON public.scans FOR UPDATE USING (true);
