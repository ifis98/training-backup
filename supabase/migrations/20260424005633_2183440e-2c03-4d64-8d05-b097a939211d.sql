
-- 1. admin_alerts
CREATE TABLE public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  practice_id uuid REFERENCES public.practices(id) ON DELETE CASCADE,
  target_user_id uuid,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  admin_notes text NOT NULL DEFAULT '',
  follow_up_at timestamptz,
  next_step text NOT NULL DEFAULT '',
  dedupe_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_admin_alerts_status ON public.admin_alerts(status);
CREATE INDEX idx_admin_alerts_practice ON public.admin_alerts(practice_id);
CREATE INDEX idx_admin_alerts_type ON public.admin_alerts(type);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ByteSense admins can manage alerts"
  ON public.admin_alerts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'bytesense_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'bytesense_admin'::app_role));

CREATE TRIGGER trg_admin_alerts_updated
  BEFORE UPDATE ON public.admin_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.admin_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;

-- 2. practice_schedule
CREATE TABLE public.practice_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL UNIQUE REFERENCES public.practices(id) ON DELETE CASCADE,
  closed_days text[] NOT NULL DEFAULT ARRAY['sat','sun']::text[],
  holidays date[] NOT NULL DEFAULT '{}'::date[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ByteSense admins can manage all schedules"
  ON public.practice_schedule FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'bytesense_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'bytesense_admin'::app_role));

CREATE POLICY "Practice members can view own schedule"
  ON public.practice_schedule FOR SELECT
  TO authenticated
  USING (practice_id = get_user_practice_id(auth.uid()));

CREATE POLICY "Practice admins can insert schedule"
  ON public.practice_schedule FOR INSERT
  TO authenticated
  WITH CHECK (practice_id = get_user_practice_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Practice admins can update schedule"
  ON public.practice_schedule FOR UPDATE
  TO authenticated
  USING (practice_id = get_user_practice_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_practice_schedule_updated
  BEFORE UPDATE ON public.practice_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. profiles.last_seen_at
ALTER TABLE public.profiles
  ADD COLUMN last_seen_at timestamptz;

-- 4. support_bookings triage fields
ALTER TABLE public.support_bookings
  ADD COLUMN assigned_to uuid,
  ADD COLUMN admin_notes text NOT NULL DEFAULT '',
  ADD COLUMN follow_up_at timestamptz,
  ADD COLUMN triage_status text NOT NULL DEFAULT 'new';

CREATE POLICY "ByteSense admins can update bookings"
  ON public.support_bookings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'bytesense_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'bytesense_admin'::app_role));
