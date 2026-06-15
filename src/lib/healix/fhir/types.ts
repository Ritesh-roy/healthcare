// FHIR R4 minimal TypeScript types — only the fields HEALIX uses.
// Designed to match the real FHIR R4 spec so swapping mock -> REST is free.

export type FhirReference = { reference: string; display?: string };
export type FhirCoding = { system?: string; code: string; display?: string };
export type FhirCodeableConcept = { coding?: FhirCoding[]; text?: string };
export type FhirIdentifier = { system?: string; value: string };
export type FhirPeriod = { start?: string; end?: string };
export type FhirQuantity = { value: number; unit?: string; system?: string; code?: string };

export interface FhirPatient {
  resourceType: "Patient";
  id: string;
  identifier?: FhirIdentifier[];
  name: { given: string[]; family: string; text?: string }[];
  gender: "male" | "female" | "other" | "unknown";
  birthDate: string; // YYYY-MM-DD
  telecom?: { system: "phone" | "email"; value: string }[];
  address?: { line?: string[]; city?: string; state?: string; postalCode?: string; country?: string }[];
  maritalStatus?: FhirCodeableConcept;
  // app extensions
  photoUrl?: string;
  bloodType?: string;
  codeStatus?: "Full Code" | "DNR" | "DNI";
  primaryCare?: string;
}

export interface FhirEncounter {
  resourceType: "Encounter";
  id: string;
  status: "planned" | "arrived" | "in-progress" | "finished" | "cancelled";
  class: FhirCoding;
  subject: FhirReference;
  participant?: { individual: FhirReference }[];
  period: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
  serviceProvider?: FhirReference;
}

export interface FhirObservation {
  resourceType: "Observation";
  id: string;
  status: "registered" | "preliminary" | "final" | "amended";
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject: FhirReference;
  effectiveDateTime: string;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  interpretation?: FhirCodeableConcept[];
}

export interface FhirCondition {
  resourceType: "Condition";
  id: string;
  clinicalStatus: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  severity?: FhirCodeableConcept;
  code: FhirCodeableConcept;
  subject: FhirReference;
  onsetDateTime?: string;
  recordedDate?: string;
}

export interface FhirMedicationRequest {
  resourceType: "MedicationRequest";
  id: string;
  status: "active" | "completed" | "stopped" | "on-hold" | "draft";
  intent: "order" | "plan" | "proposal";
  medicationCodeableConcept: FhirCodeableConcept;
  subject: FhirReference;
  authoredOn: string;
  requester?: FhirReference;
  dosageInstruction?: {
    text?: string;
    timing?: { repeat?: { frequency?: number; period?: number; periodUnit?: string } };
    doseAndRate?: { doseQuantity?: FhirQuantity }[];
    route?: FhirCodeableConcept;
  }[];
  dispenseRequest?: { numberOfRepeatsAllowed?: number; quantity?: FhirQuantity };
}

export interface FhirAllergyIntolerance {
  resourceType: "AllergyIntolerance";
  id: string;
  clinicalStatus: FhirCodeableConcept;
  type?: "allergy" | "intolerance";
  category?: ("food" | "medication" | "environment" | "biologic")[];
  criticality?: "low" | "high" | "unable-to-assess";
  code: FhirCodeableConcept;
  patient: FhirReference;
  reaction?: { manifestation: FhirCodeableConcept[]; severity?: "mild" | "moderate" | "severe" }[];
}

export interface FhirDiagnosticReport {
  resourceType: "DiagnosticReport";
  id: string;
  status: "registered" | "partial" | "preliminary" | "final" | "amended";
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject: FhirReference;
  effectiveDateTime: string;
  conclusion?: string;
  result?: FhirReference[];
}

export interface FhirPractitioner {
  resourceType: "Practitioner";
  id: string;
  name: { given: string[]; family: string; prefix?: string[] }[];
  qualification?: { code: FhirCodeableConcept }[];
  telecom?: { system: "phone" | "email"; value: string }[];
  photoUrl?: string;
  specialty?: string;
}

export interface FhirAppointment {
  resourceType: "Appointment";
  id: string;
  status: "proposed" | "pending" | "booked" | "arrived" | "fulfilled" | "cancelled" | "noshow";
  serviceType?: FhirCodeableConcept[];
  start: string;
  end: string;
  minutesDuration?: number;
  description?: string;
  participant: { actor: FhirReference; status: "accepted" | "declined" | "tentative" | "needs-action" }[];
}

export type FhirResource =
  | FhirPatient
  | FhirEncounter
  | FhirObservation
  | FhirCondition
  | FhirMedicationRequest
  | FhirAllergyIntolerance
  | FhirDiagnosticReport
  | FhirPractitioner
  | FhirAppointment;

export interface FhirBundle<T extends FhirResource = FhirResource> {
  resourceType: "Bundle";
  type: "searchset" | "collection";
  total?: number;
  entry?: { resource: T }[];
}

export type PatientSummary = {
  id: string;
  fullName: string;
  age: number;
  gender: FhirPatient["gender"];
  mrn: string;
  phone?: string;
  email?: string;
  city?: string;
  bloodType?: string;
  photoUrl?: string;
  codeStatus?: FhirPatient["codeStatus"];
  lastVisit?: string;
  riskScore: number; // 0-100
  activeConditions: number;
  activeMedications: number;
};