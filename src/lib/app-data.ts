import { supabase } from "@/integrations/supabase/client";

export type PatientRow = Awaited<ReturnType<typeof fetchPatients>>[number];
export type DoctorRow = Awaited<ReturnType<typeof fetchDoctors>>[number];
export type HospitalRow = Awaited<ReturnType<typeof fetchHospitals>>[number];
export type ReferralRow = Awaited<ReturnType<typeof fetchReferrals>>[number];
export type AppointmentRow = Awaited<ReturnType<typeof fetchAppointments>>[number];
export type ActivityRow = Awaited<ReturnType<typeof fetchActivity>>[number];

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchPatients() {
  const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDoctors() {
  const { data, error } = await supabase.from("doctors").select("*").eq("status", "active").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchHospitals() {
  const { data, error } = await supabase.from("hospitals").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReferrals() {
  const { data, error } = await supabase.from("referrals").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAppointments() {
  const { data, error } = await supabase.from("appointments").select("*").order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchConsultations() {
  const { data, error } = await supabase.from("consultations").select("*").order("consultation_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchActivity() {
  const { data, error } = await supabase
    .from("user_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export function formatMrn(patient: Pick<PatientRow, "id" | "mrn">) {
  return patient.mrn ?? `MRN-${patient.id.slice(0, 6).toUpperCase()}`;
}

export function ageFromDob(dob: string | null) {
  if (!dob) return "—";
  return Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))).toString();
}