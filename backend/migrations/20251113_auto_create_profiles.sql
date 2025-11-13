-- =====================================================
-- AUTOMATIC PROFILE CREATION FOR NEW USERS
-- =====================================================
-- Ensures every auth user gets a matching profile row
-- with a friendly display name and username.
-- =====================================================

-- 1. Create helper function to sanitize usernames
CREATE OR REPLACE FUNCTION public.normalize_username(input_name TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF input_name IS NULL OR length(trim(input_name)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Lowercase, remove non-alphanumeric, collapse duplicates
  cleaned := lower(regexp_replace(input_name, '[^a-z0-9]+', '', 'g'));

  IF length(cleaned) = 0 THEN
    RETURN NULL;
  END IF;

  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Function that runs whenever a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profiles()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_display_name TEXT;
  v_username TEXT;
  v_fallback TEXT;
BEGIN
  v_email := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data ->> 'email'
  );

  v_fallback := 'Member ' || substring(NEW.id::text, 1, 8);

  v_display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    CASE
      WHEN v_email IS NOT NULL THEN initcap(split_part(v_email, '@', 1))
      ELSE NULL
    END,
    v_fallback
  );

  v_username := COALESCE(
    normalize_username(NEW.raw_user_meta_data ->> 'username'),
    normalize_username(NEW.raw_user_meta_data ->> 'preferred_username'),
    normalize_username(NEW.raw_user_meta_data ->> 'display_name'),
    normalize_username(NEW.raw_user_meta_data ->> 'full_name'),
    normalize_username(NEW.raw_user_meta_data ->> 'name'),
    normalize_username(split_part(COALESCE(v_email, ''), '@', 1)),
    'user' || replace(substring(NEW.id::text, 1, 12), '-', '')
  );

  INSERT INTO public.profiles (user_id, email, username, display_name)
  VALUES (
    NEW.id,
    v_email,
    v_username,
    v_display_name
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- 3. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user_profiles();

