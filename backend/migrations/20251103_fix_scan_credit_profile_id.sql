-- Ensure scan credit functions reference profiles.id instead of profiles.user_id
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
