-- Quick diagnostic script to check scans table schema
-- Run this in Supabase SQL Editor or via psql

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'scans'
ORDER BY ordinal_position;
