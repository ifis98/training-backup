
CREATE TABLE public.support_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own bookings"
  ON public.support_bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own bookings"
  ON public.support_bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
  ON public.support_bookings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ByteSense admins can view all bookings"
  ON public.support_bookings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'bytesense_admin'::app_role));

CREATE TRIGGER update_support_bookings_updated_at
  BEFORE UPDATE ON public.support_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
