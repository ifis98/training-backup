ALTER TABLE public.demo_requests ADD COLUMN operatories integer DEFAULT 0;
ALTER TABLE public.demo_requests ADD COLUMN monthly_patients integer DEFAULT 0;
ALTER TABLE public.demo_requests ADD COLUMN guards_per_month integer DEFAULT 0;
ALTER TABLE public.demo_requests ADD COLUMN guard_price numeric DEFAULT 0;
ALTER TABLE public.demo_requests ADD COLUMN has_scanner boolean DEFAULT false;
ALTER TABLE public.demo_requests ADD COLUMN scanner_type text DEFAULT '';
ALTER TABLE public.demo_requests ADD COLUMN goals text[] DEFAULT '{}';
ALTER TABLE public.demo_requests ADD COLUMN practice_size text DEFAULT '';