-- Check if the GRANT commands worked
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name IN ('deduct_scan_credit', 'has_scan_credits')
ORDER BY routine_name, grantee;

-- Should show service_role, authenticated, and anon with EXECUTE privilege

