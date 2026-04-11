-- Backfill: add 'admin' role for existing practice owners who don't have it
INSERT INTO public.user_roles (user_id, role)
SELECT p.owner_id, 'admin'::app_role
FROM public.practices p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.owner_id AND ur.role = 'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create trigger function to auto-assign admin role to practice owners
CREATE OR REPLACE FUNCTION public.auto_assign_admin_to_practice_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on practices table
CREATE TRIGGER practice_owner_admin_role
AFTER INSERT ON public.practices
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin_to_practice_owner();