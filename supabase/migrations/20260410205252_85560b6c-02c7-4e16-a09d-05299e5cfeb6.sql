
-- Generate 8-char registration code
CREATE OR REPLACE FUNCTION public.generate_registration_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Registration codes table
CREATE TABLE public.registration_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL DEFAULT public.generate_registration_code(),
  practice_name text NOT NULL,
  rep_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '48 hours'),
  used_by uuid,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ByteSense admins can manage codes"
ON public.registration_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'bytesense_admin'))
WITH CHECK (public.has_role(auth.uid(), 'bytesense_admin'));

CREATE TRIGGER update_registration_codes_updated_at
BEFORE UPDATE ON public.registration_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Validate registration code RPC
CREATE OR REPLACE FUNCTION public.validate_registration_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  SELECT * INTO rec FROM public.registration_codes
  WHERE code = upper(trim(_code))
    AND status = 'active'
    AND expires_at > now();

  IF rec IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid or expired code');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code_id', rec.id,
    'practice_name', rec.practice_name,
    'rep_name', rec.rep_name
  );
END;
$$;

-- Use registration code RPC
CREATE OR REPLACE FUNCTION public.use_registration_code(_code text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  SELECT * INTO rec FROM public.registration_codes
  WHERE code = upper(trim(_code))
    AND status = 'active'
    AND expires_at > now();

  IF rec IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.registration_codes
  SET status = 'used', used_by = _user_id, used_at = now()
  WHERE id = rec.id;

  RETURN true;
END;
$$;

-- Demo requests table
CREATE TABLE public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  practice_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit demo request"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "ByteSense admins can view demo requests"
ON public.demo_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'bytesense_admin'));

CREATE POLICY "ByteSense admins can update demo requests"
ON public.demo_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'bytesense_admin'));

CREATE TRIGGER update_demo_requests_updated_at
BEFORE UPDATE ON public.demo_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ByteSense admin policies on existing tables
CREATE POLICY "ByteSense admins can view all practices"
ON public.practices
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'bytesense_admin'));

CREATE POLICY "ByteSense admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'bytesense_admin'));

CREATE POLICY "ByteSense admins can view all training"
ON public.training_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'bytesense_admin'));

CREATE POLICY "ByteSense admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'bytesense_admin'))
WITH CHECK (public.has_role(auth.uid(), 'bytesense_admin'));
