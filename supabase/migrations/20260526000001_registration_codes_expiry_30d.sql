ALTER TABLE public.registration_codes
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');
