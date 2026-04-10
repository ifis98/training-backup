
-- Add practice_code column
ALTER TABLE public.practices ADD COLUMN practice_code text UNIQUE;

-- Generate codes for existing practices
CREATE OR REPLACE FUNCTION public.generate_practice_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Auto-generate practice_code on insert
CREATE OR REPLACE FUNCTION public.set_practice_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.practice_code IS NULL THEN
    NEW.practice_code := public.generate_practice_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_practice_code
BEFORE INSERT ON public.practices
FOR EACH ROW
EXECUTE FUNCTION public.set_practice_code();

-- Update existing practices that have null codes
UPDATE public.practices SET practice_code = public.generate_practice_code() WHERE practice_code IS NULL;

-- Allow any authenticated user to look up a practice by code (for join requests)
CREATE POLICY "Anyone can search practices by code"
ON public.practices
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive select policy since the new one is more permissive
DROP POLICY IF EXISTS "Users can view their own practice" ON public.practices;

-- Allow authenticated users to insert join requests (status = 'requested')
CREATE POLICY "Users can request to join a practice"
ON public.staff_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'requested'
  AND email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
);

-- Allow admins to update invitation status (approve/deny)  
CREATE POLICY "Admins can update invitation status"
ON public.staff_invitations
FOR UPDATE
TO authenticated
USING (
  practice_id = public.get_user_practice_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.staff_invitations
FOR DELETE
TO authenticated
USING (
  practice_id = public.get_user_practice_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update profiles in their practice (to clear practice_id on removal)
CREATE POLICY "Admins can update practice member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  practice_id = public.get_user_practice_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete training progress for their practice members
CREATE POLICY "Admins can delete practice training"
ON public.training_progress
FOR DELETE
TO authenticated
USING (
  practice_id = public.get_user_practice_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
