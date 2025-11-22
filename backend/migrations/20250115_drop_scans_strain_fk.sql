-- Migration: Drop foreign key constraint on scans.matched_strain_slug
-- This allows scans to reference strain slugs that may not exist in the strains table
-- Run this in Supabase SQL Editor

-- Drop the foreign key constraint if it exists
ALTER TABLE public.scans
DROP CONSTRAINT IF EXISTS scans_matched_strain_slug_fkey;

-- Verify the constraint is dropped (this will show an error if constraint still exists, which is fine)
-- SELECT constraint_name 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'scans' 
-- AND constraint_name = 'scans_matched_strain_slug_fkey';

