-- =====================================================
-- Grower Moderator Comped Membership Automation
-- =====================================================

-- Extend profiles with moderator opt-in / certification markers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_certified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_certified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_moderator_opt_in BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_moderator_opt_in_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.grower_certified IS 'Certified grower status verified by StrainSpotter staff';
COMMENT ON COLUMN profiles.grower_certified_at IS 'Timestamp when grower certification was last verified';
COMMENT ON COLUMN profiles.grower_moderator_opt_in IS 'Grower agreed to serve as a moderator in exchange for membership perks';
COMMENT ON COLUMN profiles.grower_moderator_opt_in_at IS 'Timestamp when grower opted into moderator duties';

-- Track comped memberships (e.g., moderator perks)
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS comped BOOLEAN DEFAULT false;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS comped_reason TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS comped_started_at TIMESTAMPTZ;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS comped_ended_at TIMESTAMPTZ;

COMMENT ON COLUMN memberships.comped IS 'Whether this membership is provided free of charge (comped)';
COMMENT ON COLUMN memberships.comped_reason IS 'Reason for comped access (e.g., grower-moderator)';
COMMENT ON COLUMN memberships.comped_started_at IS 'When comped access began';
COMMENT ON COLUMN memberships.comped_ended_at IS 'When comped access ended';

-- Ensure a single membership record per user for easier automation
CREATE UNIQUE INDEX IF NOT EXISTS uq_memberships_user_id ON memberships(user_id);

-- Timestamp automation for grower flags
CREATE OR REPLACE FUNCTION public.set_grower_flag_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_certified BOOLEAN := false;
  old_opt_in BOOLEAN := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_certified := COALESCE(OLD.grower_certified, false);
    old_opt_in := COALESCE(OLD.grower_moderator_opt_in, false);
  END IF;

  IF NEW.grower_certified THEN
    IF NOT old_certified THEN
      NEW.grower_certified_at := now();
    ELSE
      NEW.grower_certified_at := COALESCE(NEW.grower_certified_at, OLD.grower_certified_at);
    END IF;
  ELSE
    NEW.grower_certified_at := NULL;
  END IF;

  IF NEW.grower_moderator_opt_in THEN
    IF NOT old_opt_in THEN
      NEW.grower_moderator_opt_in_at := now();
    ELSE
      NEW.grower_moderator_opt_in_at := COALESCE(NEW.grower_moderator_opt_in_at, OLD.grower_moderator_opt_in_at);
    END IF;
  ELSE
    NEW.grower_moderator_opt_in_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_grower_flag_timestamps ON profiles;
CREATE TRIGGER trg_profiles_grower_flag_timestamps
  BEFORE INSERT OR UPDATE OF grower_certified, grower_moderator_opt_in
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_grower_flag_timestamps();

-- Helper to upsert comped membership for moderators
CREATE OR REPLACE FUNCTION public.grant_moderator_comp_membership(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing memberships%ROWTYPE;
  user_email TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT *
  INTO existing
  FROM memberships
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing.email IS NOT NULL THEN
    user_email := existing.email;
  ELSE
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
  END IF;

  IF existing.id IS NULL THEN
    INSERT INTO memberships (
      user_id,
      email,
      status,
      tier,
      comped,
      comped_reason,
      comped_started_at,
      joined_at,
      payment_method
    )
    VALUES (
      p_user_id,
      COALESCE(user_email, ''),
      'active',
      'full-access',
      true,
      'grower-moderator',
      now(),
      now(),
      'comped'
    );
  ELSE
    UPDATE memberships
    SET
      email = COALESCE(user_email, memberships.email),
      status = 'active',
      tier = 'full-access',
      comped = true,
      comped_reason = 'grower-moderator',
      comped_started_at = COALESCE(memberships.comped_started_at, now()),
      comped_ended_at = NULL,
      expires_at = NULL,
      payment_method = COALESCE(memberships.payment_method, 'comped')
    WHERE id = existing.id;
  END IF;
END;
$$;

-- Helper to revoke comped membership when moderator status ends
CREATE OR REPLACE FUNCTION public.revoke_moderator_comp_membership(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE memberships
  SET
    comped = false,
    comped_reason = NULL,
    comped_ended_at = now(),
    expires_at = COALESCE(expires_at, now()),
    status = CASE WHEN status = 'active' THEN 'expired' ELSE status END
  WHERE user_id = p_user_id
    AND comped = true
    AND comped_reason = 'grower-moderator';
END;
$$;

-- Central sync routine used by triggers & API
CREATE OR REPLACE FUNCTION public.refresh_comp_membership_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  moderator_active BOOLEAN := false;
  certified BOOLEAN := false;
  opt_in BOOLEAN := false;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM moderators
    WHERE user_id = p_user_id
      AND is_active = true
  ) INTO moderator_active;

  SELECT grower_certified, grower_moderator_opt_in
  INTO certified, opt_in
  FROM profiles
  WHERE user_id = p_user_id;

  IF moderator_active AND certified AND opt_in THEN
    PERFORM public.grant_moderator_comp_membership(p_user_id);
  ELSE
    PERFORM public.revoke_moderator_comp_membership(p_user_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_comp_membership_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_comp_membership_for_user(UUID) TO service_role;

-- Trigger glue for moderators table
CREATE OR REPLACE FUNCTION public.moderator_comp_membership_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_comp_membership_for_user(OLD.user_id);
  ELSE
    PERFORM public.refresh_comp_membership_for_user(NEW.user_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_moderators_comp_sync ON moderators;
CREATE TRIGGER trg_moderators_comp_sync
  AFTER INSERT OR UPDATE OR DELETE ON moderators
  FOR EACH ROW
  EXECUTE FUNCTION public.moderator_comp_membership_trigger();

-- Trigger glue for profile flag changes
CREATE OR REPLACE FUNCTION public.profile_comp_membership_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_comp_membership_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_comp_sync ON profiles;
CREATE TRIGGER trg_profiles_comp_sync
  AFTER UPDATE OF grower_certified, grower_moderator_opt_in, is_grower
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profile_comp_membership_trigger();
