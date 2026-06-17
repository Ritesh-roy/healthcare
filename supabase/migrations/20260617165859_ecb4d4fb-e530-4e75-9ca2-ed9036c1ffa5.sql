DROP POLICY IF EXISTS "admins can read all activity" ON public.user_activity;
CREATE POLICY "admins can read all activity" ON public.user_activity
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "users can create own sessions" ON public.user_sessions;
CREATE POLICY "users can create own sessions" ON public.user_sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "users can update own sessions" ON public.user_sessions;
CREATE POLICY "users can update own sessions" ON public.user_sessions
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());