import type {
  FhirAllergyIntolerance,
  FhirAppointment,
  FhirCondition,
  FhirDiagnosticReport,
  FhirEncounter,
  FhirMedicationRequest,
  FhirObservation,
  FhirPatient,
  FhirPractitioner,
  PatientSummary,
} from "./types";

// Single seam for all FHIR data access. Swap mock -> rest with one env flip.
export interface FhirClient {
  // Patient
  listPatients(query?: { search?: string; limit?: number }): Promise<PatientSummary[]>;
  getPatient(id: string): Promise<FhirPatient | null>;

  // Encounters / Vitals / Conditions / Meds / Allergies / Reports
  listEncounters(patientId: string): Promise<FhirEncounter[]>;
  listObservations(patientId: string, category?: "vital-signs" | "laboratory"): Promise<FhirObservation[]>;
  listConditions(patientId: string): Promise<FhirCondition[]>;
  listMedications(patientId: string): Promise<FhirMedicationRequest[]>;
  listAllergies(patientId: string): Promise<FhirAllergyIntolerance[]>;
  listDiagnosticReports(patientId: string): Promise<FhirDiagnosticReport[]>;

  // Practitioners
  listPractitioners(): Promise<FhirPractitioner[]>;
  getPractitioner(id: string): Promise<FhirPractitioner | null>;

  // Appointments
  listAppointments(query?: { from?: string; to?: string; patientId?: string }): Promise<FhirAppointment[]>;
  createAppointment(input: Omit<FhirAppointment, "id" | "resourceType">): Promise<FhirAppointment>;

  // Aggregate KPIs (computed server-side once real FHIR plugged in)
  getDashboardKpis(): Promise<{
    activePatients: number;
    appointmentsToday: number;
    criticalAlerts: number;
    revenueMtd: number;
    bedOccupancy: number;
    avgWaitMinutes: number;
  }>;
}