-- Atomic code redemption function for Clerk-based auth.
-- The existing use_registration_code() takes a Supabase UUID — incompatible with Clerk.
-- This function does the same job but needs no user_id.
-- It uses a single UPDATE...RETURNING to atomically validate + consume in one statement.

CREATE OR REPLACE FUNCTION public.redeem_registration_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_practice_name text;
  v_rep_name       text;
BEGIN
  -- Atomically mark the code as used only if it is currently active and not expired.
  -- The single UPDATE prevents race conditions (no separate SELECT + UPDATE window).
  WITH updated AS (
    UPDATE registration_codes
    SET    status   = 'used',
           used_at  = now()
    WHERE  code       = upper(trim(_code))
      AND  status     = 'active'
      AND  expires_at > now()
    RETURNING practice_name, rep_name
  )
  SELECT practice_name, rep_name
  INTO   v_practice_name, v_rep_name
  FROM   updated;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Code is invalid, expired, or already used'
    );
  END IF;

  RETURN jsonb_build_object(
    'success',       true,
    'practice_name', v_practice_name,
    'rep_name',      v_rep_name
  );
END;
$$;

-- Grant execute to anon so the client-side (unauthenticated) can call it
GRANT EXECUTE ON FUNCTION public.redeem_registration_code(text) TO anon;
