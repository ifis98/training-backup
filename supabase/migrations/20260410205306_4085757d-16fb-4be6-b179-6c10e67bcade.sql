
DROP POLICY "Anyone can submit demo request" ON public.demo_requests;
CREATE POLICY "Anyone can submit demo request"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (length(trim(name)) > 0 AND length(trim(email)) > 0);
