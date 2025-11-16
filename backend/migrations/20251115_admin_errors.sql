-- =====================================================
-- Admin error log table
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  path TEXT,
  method TEXT,
  status_code INTEGER,
  message TEXT,
  stack TEXT,
  context JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_errors_created_at ON admin_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_errors_path ON admin_errors(path);


