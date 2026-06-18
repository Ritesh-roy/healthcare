import { supabase } from "@/integrations/supabase/client";

export type FootAssessmentRow = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  patient_name: string;
  patient_age: number | null;
  patient_gender: string | null;
  patient_phone: string | null;
  diabetes: boolean;
  hypertension: boolean;
  smoking: boolean;
  previous_foot_surgery: boolean;
  symptoms: string[];
  left_toe_pressure: number | null;
  right_toe_pressure: number | null;
  left_foot_pressure: number | null;
  right_foot_pressure: number | null;
  circulation_status: string;
  doctor_remarks: string | null;
  observations: string | null;
  diagnosis_notes: string | null;
  recommendations: string[];
  risk_level: string;
  doctor_name: string | null;
  assessment_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const SYMPTOM_OPTIONS = [
  "Foot Pain",
  "Numbness",
  "Tingling Sensation",
  "Burning Sensation",
  "Cold Feet",
  "Swelling",
  "Walking Difficulty",
] as const;

export const CIRCULATION_OPTIONS = [
  "Normal",
  "Mild Reduction",
  "Moderate Reduction",
  "Severe Reduction",
] as const;

export const RECOMMENDATION_OPTIONS = [
  "Normal Follow-Up",
  "Diabetic Foot Care",
  "Vascular Specialist Referral",
  "Further Investigation Required",
] as const;

export const RISK_LEVELS = ["Low", "Medium", "High"] as const;

export async function fetchFootAssessments(): Promise<FootAssessmentRow[]> {
  const { data, error } = await supabase
    .from("foot_assessments" as never)
    .select("*")
    .order("assessment_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FootAssessmentRow[];
}

export async function fetchFootAssessment(id: string): Promise<FootAssessmentRow | null> {
  const { data, error } = await supabase
    .from("foot_assessments" as never)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as FootAssessmentRow) ?? null;
}

/**
 * Estimate diabetic-foot risk from pressures, circulation, history and symptoms.
 * Toe-pressure literature: <30 mmHg severe, 30–50 borderline, >50 normal.
 */
export function computeRiskLevel(input: {
  left_toe_pressure: number | null;
  right_toe_pressure: number | null;
  circulation_status: string;
  diabetes: boolean;
  smoking: boolean;
  symptoms: string[];
}): "Low" | "Medium" | "High" {
  let score = 0;
  const toes = [input.left_toe_pressure, input.right_toe_pressure].filter(
    (v): v is number => typeof v === "number",
  );
  const minToe = toes.length ? Math.min(...toes) : null;
  if (minToe !== null) {
    if (minToe < 30) score += 3;
    else if (minToe < 50) score += 2;
    else if (minToe < 70) score += 1;
  }
  if (input.circulation_status === "Severe Reduction") score += 3;
  else if (input.circulation_status === "Moderate Reduction") score += 2;
  else if (input.circulation_status === "Mild Reduction") score += 1;
  if (input.diabetes) score += 1;
  if (input.smoking) score += 1;
  if (input.symptoms.length >= 3) score += 1;
  if (score >= 5) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

export function riskTone(level: string): string {
  if (level === "High") return "text-[oklch(var(--status-danger))] border-[oklch(var(--status-danger)/40%)] bg-[var(--status-danger-bg)]";
  if (level === "Medium") return "text-[oklch(var(--status-warn))] border-[oklch(var(--status-warn)/40%)] bg-[var(--status-warn-bg)]";
  return "text-[oklch(var(--status-success))] border-[oklch(var(--status-success)/40%)] bg-[var(--status-success-bg)]";
}

export function circulationTone(status: string): string {
  if (status === "Severe Reduction") return "text-[oklch(var(--status-danger))] bg-[var(--status-danger-bg)]";
  if (status === "Moderate Reduction") return "text-[oklch(var(--status-warn))] bg-[var(--status-warn-bg)]";
  if (status === "Mild Reduction") return "text-[oklch(var(--status-info))] bg-[var(--status-info-bg)]";
  return "text-[oklch(var(--status-success))] bg-[var(--status-success-bg)]";
}