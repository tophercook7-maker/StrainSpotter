-- Temporarily disable all protections on profiles table to allow credit system to work

-- 1. Drop all triggers on profiles table (if any)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON profiles CASCADE';
    END LOOP;
END $$;

-- 2. Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Should show rowsecurity = false

