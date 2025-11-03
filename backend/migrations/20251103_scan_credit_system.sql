-- Scan credit tracking for AI usage
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS scan_credits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scan_credits_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS scan_credits_monthly_bundle integer DEFAULT 0;

UPDATE profiles
SET scan_credits = COALESCE(scan_credits, 0),
    scan_credits_monthly_bundle = COALESCE(scan_credits_monthly_bundle, 0);

COMMENT ON COLUMN profiles.scan_credits IS 'Remaining AI scan credits available to the user.';
COMMENT ON COLUMN profiles.scan_credits_reset_at IS 'Timestamp when monthly scan credits were last reset.';
COMMENT ON COLUMN profiles.scan_credits_monthly_bundle IS 'Number of credits granted on each monthly reset.';

CREATE TABLE IF NOT EXISTS scan_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE scan_credit_transactions IS 'Audit log of scan credit additions and deductions.';
COMMENT ON COLUMN scan_credit_transactions.amount IS 'Positive values add credits; negative values consume credits.';
COMMENT ON COLUMN scan_credit_transactions.reason IS 'Machine-friendly reason code (e.g., scan-use, starter-bundle, membership-reset, iap-topup).';

-- Relax grower experience minimum; directory logic now sorts instead of enforcing >=3
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_grower_experience_years_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_grower_experience_years_check CHECK (grower_experience_years IS NULL OR grower_experience_years >= 0);

-- Helper to add credits atomically
CREATE OR REPLACE FUNCTION public.grant_scan_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE NOTICE 'grant_scan_credits called with non-positive amount, ignoring';
    RETURN;
  END IF;

  UPDATE profiles
  SET scan_credits = COALESCE(scan_credits, 0) + p_amount
  WHERE id = p_user_id;

  INSERT INTO scan_credit_transactions(user_id, amount, reason, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- Helper to consume credits atomically
CREATE OR REPLACE FUNCTION public.consume_scan_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  updated BOOLEAN;
BEGIN
  IF p_amount <= 0 THEN
    RETURN TRUE;
  END IF;

  UPDATE profiles
  SET scan_credits = COALESCE(scan_credits, 0) - p_amount
  WHERE id = p_user_id AND COALESCE(scan_credits, 0) >= p_amount
  RETURNING TRUE INTO updated;

  IF updated THEN
    INSERT INTO scan_credit_transactions(user_id, amount, reason, metadata)
    VALUES (p_user_id, -p_amount, p_reason, p_metadata);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
