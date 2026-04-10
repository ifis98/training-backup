
CREATE TABLE public.simulation_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  practice_id uuid REFERENCES public.practices(id),
  session_number integer NOT NULL DEFAULT 1,
  score integer NOT NULL DEFAULT 0,
  score_label text NOT NULL DEFAULT '',
  strengths text[] NOT NULL DEFAULT '{}',
  improvements text[] NOT NULL DEFAULT '{}',
  tips text[] NOT NULL DEFAULT '{}',
  modules_to_review text[] NOT NULL DEFAULT '{}',
  overall_feedback text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulation reviews"
ON public.simulation_reviews FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own simulation reviews"
ON public.simulation_reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view practice simulation reviews"
ON public.simulation_reviews FOR SELECT
TO authenticated
USING (
  practice_id = get_user_practice_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "ByteSense admins can view all simulation reviews"
ON public.simulation_reviews FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'bytesense_admin'));

CREATE TRIGGER update_simulation_reviews_updated_at
BEFORE UPDATE ON public.simulation_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
