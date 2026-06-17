DROP POLICY IF EXISTS "auth insert audit" ON public.audit_logs;
CREATE POLICY "signed in users can create own audit logs" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can log activity" ON public.user_activity;
CREATE POLICY "signed in users can create own activity" ON public.user_activity
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());