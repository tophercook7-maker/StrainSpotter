-- Check RPC function permissions

-- 1. Check function owner and security
SELECT 
  routine_name,
  routine_schema,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'deduct_scan_credit';

-- 2. Grant execute permissions to service_role and authenticated
GRANT EXECUTE ON FUNCTION deduct_scan_credit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_scan_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_scan_credit(UUID) TO anon;

GRANT EXECUTE ON FUNCTION has_scan_credits(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION has_scan_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_scan_credits(UUID) TO anon;

GRANT EXECUTE ON FUNCTION add_scan_credits(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_scan_credits(UUID, INTEGER, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_monthly_credit_limit(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_monthly_credit_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_credit_limit(TEXT) TO anon;

-- 3. Verify permissions were granted
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name IN ('deduct_scan_credit', 'has_scan_credits', 'add_scan_credits', 'get_monthly_credit_limit')
ORDER BY routine_name, grantee;

