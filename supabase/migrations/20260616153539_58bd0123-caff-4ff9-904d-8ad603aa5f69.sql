
CREATE TABLE public.user_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  user_email text,
  user_name text,
  user_role text,
  event_type text NOT NULL,
  action text,
  route text,
  metadata jsonb,
  session_id text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_activity_created_at_idx ON public.user_activity (created_at DESC);
CREATE INDEX user_activity_email_idx ON public.user_activity (user_email);
CREATE INDEX user_activity_session_idx ON public.user_activity (session_id);

GRANT INSERT ON public.user_activity TO anon, authenticated;
GRANT SELECT ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log activity"
  ON public.user_activity FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read own activity"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
