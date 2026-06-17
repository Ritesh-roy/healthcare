CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

ALTER FUNCTION public.private_has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION private.private_has_role(uuid, public.app_role) RENAME TO has_role;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "admins delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "admins update appointments" ON public.appointments;
CREATE POLICY "admins delete appointments" ON public.appointments FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update appointments" ON public.appointments FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read audit" ON public.audit_logs;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update consultations" ON public.consultations;
CREATE POLICY "admins update consultations" ON public.consultations FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins write doctors" ON public.doctors;
CREATE POLICY "admins write doctors" ON public.doctors FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins write hospitals" ON public.hospitals;
CREATE POLICY "admins write hospitals" ON public.hospitals FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins write orgs" ON public.organizations;
CREATE POLICY "admins write orgs" ON public.organizations FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete patients" ON public.patients;
DROP POLICY IF EXISTS "admins update patients" ON public.patients;
CREATE POLICY "admins delete patients" ON public.patients FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update patients" ON public.patients FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete referrals" ON public.referrals;
DROP POLICY IF EXISTS "admins update referrals" ON public.referrals;
CREATE POLICY "admins delete referrals" ON public.referrals FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update referrals" ON public.referrals FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read all sessions" ON public.user_sessions;
CREATE POLICY "admins read all sessions" ON public.user_sessions FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));