
CREATE OR REPLACE FUNCTION public.auto_assign_bytesense_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  IF user_email LIKE '%@bytesense.ai' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'bytesense_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_admin
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_bytesense_admin();
