
-- Cases table
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES public.practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  patient_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  case_value numeric NOT NULL DEFAULT 0,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view practice cases"
  ON public.cases FOR SELECT TO authenticated
  USING (practice_id = get_user_practice_id(auth.uid()));

CREATE POLICY "Users can insert own cases"
  ON public.cases FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update practice cases"
  ON public.cases FOR UPDATE TO authenticated
  USING (practice_id = get_user_practice_id(auth.uid()));

CREATE POLICY "Users can delete practice cases"
  ON public.cases FOR DELETE TO authenticated
  USING (practice_id = get_user_practice_id(auth.uid()));

CREATE POLICY "ByteSense admins can view all cases"
  ON public.cases FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'bytesense_admin'));

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Practice Goals table
CREATE TABLE public.practice_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  monthly_case_goal integer NOT NULL DEFAULT 0,
  monthly_revenue_goal numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (practice_id)
);

ALTER TABLE public.practice_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view goals"
  ON public.practice_goals FOR SELECT TO authenticated
  USING (practice_id = get_user_practice_id(auth.uid()));

CREATE POLICY "Admins can insert practice goals"
  ON public.practice_goals FOR INSERT TO authenticated
  WITH CHECK (practice_id = get_user_practice_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update practice goals"
  ON public.practice_goals FOR UPDATE TO authenticated
  USING (practice_id = get_user_practice_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "ByteSense admins can view all goals"
  ON public.practice_goals FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'bytesense_admin'));

CREATE TRIGGER update_practice_goals_updated_at
  BEFORE UPDATE ON public.practice_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
