
CREATE TABLE public.foot_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  patient_age integer,
  patient_gender text,
  patient_phone text,
  diabetes boolean NOT NULL DEFAULT false,
  hypertension boolean NOT NULL DEFAULT false,
  smoking boolean NOT NULL DEFAULT false,
  previous_foot_surgery boolean NOT NULL DEFAULT false,
  symptoms text[] NOT NULL DEFAULT '{}',
  left_toe_pressure numeric,
  right_toe_pressure numeric,
  left_foot_pressure numeric,
  right_foot_pressure numeric,
  circulation_status text NOT NULL DEFAULT 'Normal',
  doctor_remarks text,
  observations text,
  diagnosis_notes text,
  recommendations text[] NOT NULL DEFAULT '{}',
  risk_level text NOT NULL DEFAULT 'Low',
  doctor_name text,
  assessment_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.foot_assessments TO authenticated;
GRANT ALL ON public.foot_assessments TO service_role;

ALTER TABLE public.foot_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read foot_assessments" ON public.foot_assessments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "signed in staff create foot_assessments" ON public.foot_assessments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "doctors update own foot_assessments" ON public.foot_assessments
  FOR UPDATE TO authenticated
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "admins update foot_assessments" ON public.foot_assessments
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete foot_assessments" ON public.foot_assessments
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_foot_assessments_updated
  BEFORE UPDATE ON public.foot_assessments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.foot_assessments;
