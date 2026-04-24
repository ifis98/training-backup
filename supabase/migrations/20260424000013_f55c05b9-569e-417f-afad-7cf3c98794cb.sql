ALTER TABLE public.demo_requests ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';
ALTER TABLE public.practices ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;