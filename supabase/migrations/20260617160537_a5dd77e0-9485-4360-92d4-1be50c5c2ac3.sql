
-- ============ ROLES ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ updated_at trigger fn ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ HOSPITALS ============
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Hospital' CHECK (type IN ('Hospital','Clinic')),
  address text,
  phone text,
  email text,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitals TO authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read hospitals" ON public.hospitals;
CREATE POLICY "auth read hospitals" ON public.hospitals FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admins write hospitals" ON public.hospitals;
CREATE POLICY "admins write hospitals" ON public.hospitals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_hospitals_updated ON public.hospitals;
CREATE TRIGGER trg_hospitals_updated BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ ORGANIZATIONS ============
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read orgs" ON public.organizations;
CREATE POLICY "auth read orgs" ON public.organizations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admins write orgs" ON public.organizations;
CREATE POLICY "admins write orgs" ON public.organizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_orgs_updated ON public.organizations;
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ DOCTORS ============
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  specialty text,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read doctors" ON public.doctors;
CREATE POLICY "auth read doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admins write doctors" ON public.doctors;
CREATE POLICY "admins write doctors" ON public.doctors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "doctors update self" ON public.doctors;
CREATE POLICY "doctors update self" ON public.doctors FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS trg_doctors_updated ON public.doctors;
CREATE TRIGGER trg_doctors_updated BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PATIENTS ============
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mrn text,
  dob date,
  sex text CHECK (sex IN ('M','F','Other')),
  phone text,
  email text,
  address text,
  problems text[] NOT NULL DEFAULT '{}',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read patients" ON public.patients;
CREATE POLICY "auth read patients" ON public.patients FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert patients" ON public.patients;
CREATE POLICY "auth insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins update patients" ON public.patients;
CREATE POLICY "admins update patients" ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "admins delete patients" ON public.patients;
CREATE POLICY "admins delete patients" ON public.patients FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_patients_updated ON public.patients;
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ REFERRALS ============
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text UNIQUE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  specialty text,
  reason text,
  diagnosis text,
  priority text NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine','urgent','emergency')),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','accepted','scheduled','completed','rejected')),
  notes text,
  referral_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read referrals" ON public.referrals;
CREATE POLICY "auth read referrals" ON public.referrals FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert referrals" ON public.referrals;
CREATE POLICY "auth insert referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins update referrals" ON public.referrals;
CREATE POLICY "admins update referrals" ON public.referrals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "doctors update own referrals" ON public.referrals;
CREATE POLICY "doctors update own referrals" ON public.referrals FOR UPDATE TO authenticated
  USING (to_doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  WITH CHECK (to_doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins delete referrals" ON public.referrals;
CREATE POLICY "admins delete referrals" ON public.referrals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_referrals_updated ON public.referrals;
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ APPOINTMENTS ============
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  location text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read appointments" ON public.appointments;
CREATE POLICY "auth read appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert appointments" ON public.appointments;
CREATE POLICY "auth insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins update appointments" ON public.appointments;
CREATE POLICY "admins update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "admins delete appointments" ON public.appointments;
CREATE POLICY "admins delete appointments" ON public.appointments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_appointments_updated ON public.appointments;
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ CONSULTATIONS ============
CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  consultation_date timestamptz NOT NULL DEFAULT now(),
  summary text,
  recommendations text,
  follow_up text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read consultations" ON public.consultations;
CREATE POLICY "auth read consultations" ON public.consultations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert consultations" ON public.consultations;
CREATE POLICY "auth insert consultations" ON public.consultations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins update consultations" ON public.consultations;
CREATE POLICY "admins update consultations" ON public.consultations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "doctors update own consultations" ON public.consultations;
CREATE POLICY "doctors update own consultations" ON public.consultations FOR UPDATE TO authenticated
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_consultations_updated ON public.consultations;
CREATE TRIGGER trg_consultations_updated BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth insert audit" ON public.audit_logs;
CREATE POLICY "auth insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins read audit" ON public.audit_logs;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ============ USER SESSIONS ============
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  login_at timestamptz NOT NULL DEFAULT now(),
  logout_at timestamptz,
  last_active_at timestamptz,
  duration_seconds integer,
  ip text,
  user_agent text
);
GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users manage own sessions" ON public.user_sessions;
CREATE POLICY "users manage own sessions" ON public.user_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "admins read all sessions" ON public.user_sessions;
CREATE POLICY "admins read all sessions" ON public.user_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ============ REALTIME ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['hospitals','organizations','doctors','patients','referrals','appointments','consultations','audit_logs','user_sessions','healix_conversations']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
