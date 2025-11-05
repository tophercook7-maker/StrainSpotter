-- Find where "Only admins can modify" error is coming from

-- 1. Check for triggers on profiles table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. Check for functions that contain this error message
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%Only admins can modify%'
ORDER BY routine_name;

-- 3. List all functions in public schema
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

