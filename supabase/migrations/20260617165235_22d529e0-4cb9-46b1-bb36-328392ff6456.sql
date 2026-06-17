DROP POLICY IF EXISTS "auth insert patients" ON public.patients;
CREATE POLICY "signed in staff can create patients" ON public.patients
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP POLICY IF EXISTS "auth insert appointments" ON public.appointments;
CREATE POLICY "signed in staff can create appointments" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP POLICY IF EXISTS "auth insert referrals" ON public.referrals;
CREATE POLICY "signed in staff can create referrals" ON public.referrals
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND from_user_id = auth.uid());

DROP POLICY IF EXISTS "auth insert consultations" ON public.consultations;
CREATE POLICY "signed in staff can create consultations" ON public.consultations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP POLICY IF EXISTS "allow users to insert own activity" ON public.user_activity;
DROP POLICY IF EXISTS "auth insert user_activity" ON public.user_activity;
CREATE POLICY "signed in users can log own activity" ON public.user_activity
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;