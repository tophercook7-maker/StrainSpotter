-- =====================================================
-- PRICING SIMPLIFICATION (Phase 1)
-- -----------------------------------------------------
-- - Collapse legacy tiers (member, premium, moderator) into:
--     * free           -> default trial (10 lifetime scans)
--     * app_purchase   -> one-time unlock (20 scans)
--     * monthly_member -> 200 scans/month
--     * admin          -> unlimited
-- - Enable top-up credits for members by reusing scan_credits as a shared
--   "bonus" bucket that can be deducted once the monthly allotment is exhausted.
-- - Update RPCs and views so frontend/backend share the same tier identifiers.
-- =====================================================

-- 1. Normalize membership_tier values
UPDATE profiles
SET membership_tier = 'monthly_member'
WHERE membership_tier IN ('member', 'premium', 'moderator');

UPDATE profiles
SET membership_tier = 'free'
WHERE membership_tier IS NULL;

-- 2. Update constraint + default
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_membership_tier_check
  CHECK (membership_tier IN ('free', 'app_purchase', 'monthly_member', 'admin'));

ALTER TABLE profiles
  ALTER COLUMN membership_tier SET DEFAULT 'free';

-- 3. Monthly credit limits
CREATE OR REPLACE FUNCTION get_monthly_credit_limit(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE tier
    WHEN 'monthly_member' THEN RETURN 200;
    WHEN 'admin' THEN RETURN 999999;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 4. has_scan_credits now accounts for app_purchase + top-ups
CREATE OR REPLACE FUNCTION has_scan_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
  v_monthly_limit INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_profile.membership_tier = 'admin' THEN
    RETURN TRUE;
  END IF;

  IF v_profile.membership_tier IN ('free', 'app_purchase') THEN
    RETURN v_profile.scan_credits > 0;
  END IF;

  IF v_profile.membership_tier = 'monthly_member' THEN
    v_monthly_limit := get_monthly_credit_limit(v_profile.membership_tier);
    IF v_profile.scan_credits_used_this_month < v_monthly_limit THEN
      RETURN TRUE;
    END IF;
    RETURN v_profile.scan_credits > 0;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. Deduct credits with monthly overflow -> bonus credits
CREATE OR REPLACE FUNCTION deduct_scan_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
  v_monthly_limit INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_profile.membership_tier = 'admin' THEN
    INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 0, 'scan', 'Admin scan (unlimited)');
    RETURN TRUE;
  END IF;

  IF v_profile.membership_tier IN ('free', 'app_purchase') THEN
    IF v_profile.scan_credits <= 0 THEN
      RETURN FALSE;
    END IF;

    UPDATE profiles
    SET
      scan_credits = scan_credits - 1,
      lifetime_scans_used = lifetime_scans_used + 1
    WHERE id = p_user_id;

    INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, -1, 'scan', v_profile.membership_tier || ' scan');

    RETURN TRUE;
  END IF;

  IF v_profile.membership_tier = 'monthly_member' THEN
    v_monthly_limit := get_monthly_credit_limit(v_profile.membership_tier);

    IF v_profile.scan_credits_used_this_month < v_monthly_limit THEN
      UPDATE profiles
      SET
        scan_credits_used_this_month = scan_credits_used_this_month + 1,
        lifetime_scans_used = lifetime_scans_used + 1
      WHERE id = p_user_id;

      INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
      VALUES (p_user_id, -1, 'scan', 'Monthly member scan');

      RETURN TRUE;
    END IF;

    IF v_profile.scan_credits > 0 THEN
      UPDATE profiles
      SET
        scan_credits = scan_credits - 1,
        lifetime_scans_used = lifetime_scans_used + 1
      WHERE id = p_user_id;

      INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
      VALUES (p_user_id, -1, 'scan', 'Top-up scan (monthly member)');

      RETURN TRUE;
    END IF;

    RETURN FALSE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 6. add_scan_credits should increment scan_credits for all tiers
CREATE OR REPLACE FUNCTION add_scan_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT DEFAULT 'Credit purchase')
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET scan_credits = COALESCE(scan_credits, 0) + p_amount
  WHERE id = p_user_id;

  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, 'purchase', p_description);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. reset_monthly_credits only targets monthly members
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER := 0;
BEGIN
  UPDATE profiles
  SET
    scan_credits_used_this_month = 0,
    credits_reset_at = NOW()
  WHERE membership_tier = 'monthly_member'
    AND credits_reset_at < NOW() - INTERVAL '1 month';

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;

  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  SELECT id, 0, 'monthly_reset', 'Monthly credit reset'
  FROM profiles
  WHERE membership_tier = 'monthly_member'
    AND credits_reset_at >= NOW() - INTERVAL '1 minute';

  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql;

-- 8. upgrade_membership_tier handles app_purchase + monthly_member
CREATE OR REPLACE FUNCTION upgrade_membership_tier(p_user_id UUID, p_new_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_monthly_limit INTEGER;
BEGIN
  IF p_new_tier = 'app_purchase' THEN
    UPDATE profiles
    SET
      membership_tier = 'app_purchase',
      scan_credits = COALESCE(scan_credits, 0) + 20,
      credits_reset_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 20, 'membership_grant', 'App purchase unlock');

    RETURN TRUE;
  END IF;

  IF p_new_tier = 'monthly_member' THEN
    v_monthly_limit := get_monthly_credit_limit(p_new_tier);

    UPDATE profiles
    SET
      membership_tier = p_new_tier,
      scan_credits_used_this_month = 0,
      credits_reset_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, v_monthly_limit, 'membership_grant', 'Upgraded to monthly member');

    RETURN TRUE;
  END IF;

  IF p_new_tier = 'admin' THEN
    UPDATE profiles
    SET
      membership_tier = 'admin',
      scan_credits_used_this_month = 0,
      credits_reset_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 0, 'membership_grant', 'Admin promotion');

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 9. Refresh view with bonus credits visibility
CREATE OR REPLACE VIEW user_credit_balance AS
SELECT
  p.id,
  p.email,
  p.membership_tier,
  COALESCE(p.scan_credits, 0) AS lifetime_credits,
  p.scan_credits_used_this_month,
  p.lifetime_scans_used,
  p.credits_reset_at,
  COALESCE(p.scan_credits, 0) AS bonus_credits,
  CASE
    WHEN p.membership_tier = 'admin' THEN 999999
    WHEN p.membership_tier = 'monthly_member' THEN
      GREATEST(get_monthly_credit_limit(p.membership_tier) - p.scan_credits_used_this_month, 0) + COALESCE(p.scan_credits, 0)
    ELSE COALESCE(p.scan_credits, 0)
  END AS credits_remaining,
  get_monthly_credit_limit(p.membership_tier) AS monthly_limit
FROM profiles p;

GRANT SELECT ON user_credit_balance TO authenticated;


