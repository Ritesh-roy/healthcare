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
} from "./types";

export const MOCK_PRACTITIONERS: FhirPractitioner[] = [
  {
    resourceType: "Practitioner",
    id: "prac-001",
    name: [{ prefix: ["Dr."], given: ["Aanya"], family: "Kapoor" }],
    qualification: [{ code: { text: "MBBS, MD — Internal Medicine" } }],
    telecom: [{ system: "email", value: "a.kapoor@healix.io" }],
    specialty: "Internal Medicine",
  },
  {
    resourceType: "Practitioner",
    id: "prac-002",
    name: [{ prefix: ["Dr."], given: ["Marcus"], family: "Reyes" }],
    qualification: [{ code: { text: "MD, FACC — Cardiology" } }],
    specialty: "Cardiology",
  },
  {
    resourceType: "Practitioner",
    id: "prac-003",
    name: [{ prefix: ["Dr."], given: ["Sara"], family: "Lindqvist" }],
    qualification: [{ code: { text: "MD — Endocrinology" } }],
    specialty: "Endocrinology",
  },
  {
    resourceType: "Practitioner",
    id: "prac-004",
    name: [{ prefix: ["Dr."], given: ["Ravi"], family: "Menon" }],
    qualification: [{ code: { text: "MD — Pulmonology" } }],
    specialty: "Pulmonology",
  },
];

type Seed = {
  id: string;
  given: string;
  family: string;
  gender: FhirPatient["gender"];
  birthDate: string;
  city: string;
  blood: string;
  conditions: string[];
  meds: { name: string; dose: string }[];
  allergies?: string[];
  vitalsTrend: { hr: number; sbp: number; dbp: number; spo2: number; temp: number };
  riskScore: number;
  codeStatus?: FhirPatient["codeStatus"];
};

const SEEDS: Seed[] = [
  {
    id: "pat-001",
    given: "Amelia",
    family: "Hartwell",
    gender: "female",
    birthDate: "1978-04-12",
    city: "Mumbai",
    blood: "O+",
    conditions: ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
    meds: [
      { name: "Metformin", dose: "500 mg BID" },
      { name: "Lisinopril", dose: "10 mg daily" },
    ],
    allergies: ["Penicillin"],
    vitalsTrend: { hr: 82, sbp: 138, dbp: 88, spo2: 97, temp: 36.8 },
    riskScore: 72,
  },
  {
    id: "pat-002",
    given: "Jonas",
    family: "Albrecht",
    gender: "male",
    birthDate: "1962-11-03",
    city: "Delhi",
    blood: "A−",
    conditions: ["Coronary Artery Disease", "Hyperlipidemia"],
    meds: [
      { name: "Atorvastatin", dose: "40 mg HS" },
      { name: "Aspirin", dose: "75 mg daily" },
    ],
    vitalsTrend: { hr: 74, sbp: 128, dbp: 80, spo2: 96, temp: 36.6 },
    riskScore: 64,
    codeStatus: "Full Code",
  },
  {
    id: "pat-003",
    given: "Priya",
    family: "Sharma",
    gender: "female",
    birthDate: "1991-07-21",
    city: "Bengaluru",
    blood: "B+",
    conditions: ["Asthma"],
    meds: [{ name: "Salbutamol inhaler", dose: "PRN" }],
    allergies: ["Sulfa drugs", "Peanuts"],
    vitalsTrend: { hr: 88, sbp: 118, dbp: 76, spo2: 95, temp: 37.0 },
    riskScore: 41,
  },
  {
    id: "pat-004",
    given: "Marcus",
    family: "Doyle",
    gender: "male",
    birthDate: "1955-02-09",
    city: "Chennai",
    blood: "AB+",
    conditions: ["Heart Failure NYHA II", "Chronic Kidney Disease Stage 3"],
    meds: [
      { name: "Furosemide", dose: "40 mg daily" },
      { name: "Carvedilol", dose: "6.25 mg BID" },
    ],
    vitalsTrend: { hr: 92, sbp: 112, dbp: 70, spo2: 93, temp: 36.5 },
    riskScore: 86,
    codeStatus: "DNR",
  },
  {
    id: "pat-005",
    given: "Sofía",
    family: "Navarro",
    gender: "female",
    birthDate: "2002-09-14",
    city: "Pune",
    blood: "O−",
    conditions: ["Migraine"],
    meds: [{ name: "Sumatriptan", dose: "50 mg PRN" }],
    vitalsTrend: { hr: 70, sbp: 110, dbp: 68, spo2: 99, temp: 36.7 },
    riskScore: 18,
  },
  {
    id: "pat-006",
    given: "Hiroshi",
    family: "Tanaka",
    gender: "male",
    birthDate: "1984-05-30",
    city: "Hyderabad",
    blood: "A+",
    conditions: ["Hypothyroidism"],
    meds: [{ name: "Levothyroxine", dose: "75 mcg daily" }],
    vitalsTrend: { hr: 68, sbp: 120, dbp: 78, spo2: 98, temp: 36.6 },
    riskScore: 28,
  },
  {
    id: "pat-007",
    given: "Naledi",
    family: "Okeke",
    gender: "female",
    birthDate: "1969-12-05",
    city: "Kolkata",
    blood: "B−",
    conditions: ["Rheumatoid Arthritis"],
    meds: [
      { name: "Methotrexate", dose: "15 mg weekly" },
      { name: "Folic acid", dose: "5 mg weekly" },
    ],
    vitalsTrend: { hr: 76, sbp: 124, dbp: 82, spo2: 97, temp: 36.9 },
    riskScore: 54,
  },
  {
    id: "pat-008",
    given: "Liam",
    family: "O'Connor",
    gender: "male",
    birthDate: "1998-03-17",
    city: "Ahmedabad",
    blood: "O+",
    conditions: ["Generalized Anxiety Disorder"],
    meds: [{ name: "Escitalopram", dose: "10 mg daily" }],
    vitalsTrend: { hr: 84, sbp: 116, dbp: 74, spo2: 99, temp: 36.8 },
    riskScore: 22,
  },
];

function ageFrom(birthDate: string) {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function buildPatient(seed: Seed): FhirPatient {
  return {
    resourceType: "Patient",
    id: seed.id,
    identifier: [{ system: "urn:mrn", value: `MRN-${seed.id.slice(-4).toUpperCase()}` }],
    name: [{ given: [seed.given], family: seed.family, text: `${seed.given} ${seed.family}` }],
    gender: seed.gender,
    birthDate: seed.birthDate,
    telecom: [
      { system: "phone", value: "+91 90000 0000" },
      { system: "email", value: `${seed.given.toLowerCase()}.${seed.family.toLowerCase()}@example.com` },
    ],
    address: [{ city: seed.city, country: "IN" }],
    bloodType: seed.blood,
    codeStatus: seed.codeStatus ?? "Full Code",
    primaryCare: MOCK_PRACTITIONERS[0].name[0].family,
  };
}

export const MOCK_SEEDS = SEEDS;
export { ageFrom };

// Build derived FHIR resources for a patient
export function buildPatientBundle(seed: Seed) {
  const subject = { reference: `Patient/${seed.id}`, display: `${seed.given} ${seed.family}` };

  const conditions: FhirCondition[] = seed.conditions.map((name, i) => ({
    resourceType: "Condition",
    id: `${seed.id}-cond-${i}`,
    clinicalStatus: { text: "active", coding: [{ code: "active" }] },
    code: { text: name },
    subject,
    recordedDate: new Date(Date.now() - (i + 1) * 90 * 86400_000).toISOString(),
  }));

  const meds: FhirMedicationRequest[] = seed.meds.map((m, i) => ({
    resourceType: "MedicationRequest",
    id: `${seed.id}-med-${i}`,
    status: "active",
    intent: "order",
    medicationCodeableConcept: { text: m.name },
    subject,
    authoredOn: new Date(Date.now() - (i + 1) * 30 * 86400_000).toISOString(),
    dosageInstruction: [{ text: m.dose }],
  }));

  const allergies: FhirAllergyIntolerance[] = (seed.allergies ?? []).map((a, i) => ({
    resourceType: "AllergyIntolerance",
    id: `${seed.id}-allg-${i}`,
    clinicalStatus: { text: "active" },
    criticality: "high",
    category: ["medication"],
    code: { text: a },
    patient: subject,
  }));

  // 30 days of daily vital observations (HR, SBP, SpO2)
  const vitals: FhirObservation[] = [];
  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const eff = new Date(today.getTime() - d * 86400_000).toISOString();
    const jitter = (n: number, j: number) => Math.round((n + (Math.random() - 0.5) * j) * 10) / 10;
    vitals.push(
      {
        resourceType: "Observation",
        id: `${seed.id}-hr-${d}`,
        status: "final",
        category: [{ text: "vital-signs" }],
        code: { text: "Heart rate" },
        subject,
        effectiveDateTime: eff,
        valueQuantity: { value: jitter(seed.vitalsTrend.hr, 8), unit: "bpm" },
      },
      {
        resourceType: "Observation",
        id: `${seed.id}-sbp-${d}`,
        status: "final",
        category: [{ text: "vital-signs" }],
        code: { text: "Systolic BP" },
        subject,
        effectiveDateTime: eff,
        valueQuantity: { value: jitter(seed.vitalsTrend.sbp, 10), unit: "mmHg" },
      },
      {
        resourceType: "Observation",
        id: `${seed.id}-spo2-${d}`,
        status: "final",
        category: [{ text: "vital-signs" }],
        code: { text: "SpO2" },
        subject,
        effectiveDateTime: eff,
        valueQuantity: { value: jitter(seed.vitalsTrend.spo2, 1.5), unit: "%" },
      },
    );
  }

  const labs: FhirObservation[] = [
    {
      resourceType: "Observation",
      id: `${seed.id}-hba1c`,
      status: "final",
      category: [{ text: "laboratory" }],
      code: { text: "HbA1c" },
      subject,
      effectiveDateTime: new Date(Date.now() - 14 * 86400_000).toISOString(),
      valueQuantity: { value: 6.9 + Math.random(), unit: "%" },
    },
    {
      resourceType: "Observation",
      id: `${seed.id}-ldl`,
      status: "final",
      category: [{ text: "laboratory" }],
      code: { text: "LDL Cholesterol" },
      subject,
      effectiveDateTime: new Date(Date.now() - 30 * 86400_000).toISOString(),
      valueQuantity: { value: 90 + Math.random() * 50, unit: "mg/dL" },
    },
  ];

  const encounters: FhirEncounter[] = [
    {
      resourceType: "Encounter",
      id: `${seed.id}-enc-1`,
      status: "finished",
      class: { code: "AMB", display: "Ambulatory" },
      subject,
      period: { start: new Date(Date.now() - 7 * 86400_000).toISOString() },
      reasonCode: [{ text: "Follow-up visit" }],
    },
    {
      resourceType: "Encounter",
      id: `${seed.id}-enc-2`,
      status: "finished",
      class: { code: "AMB", display: "Ambulatory" },
      subject,
      period: { start: new Date(Date.now() - 60 * 86400_000).toISOString() },
      reasonCode: [{ text: "Routine physical" }],
    },
  ];

  const reports: FhirDiagnosticReport[] = [
    {
      resourceType: "DiagnosticReport",
      id: `${seed.id}-rep-1`,
      status: "final",
      category: [{ text: "Cardiology" }],
      code: { text: "ECG — 12 lead" },
      subject,
      effectiveDateTime: new Date(Date.now() - 21 * 86400_000).toISOString(),
      conclusion: "Normal sinus rhythm. No acute ST-T changes.",
    },
    {
      resourceType: "DiagnosticReport",
      id: `${seed.id}-rep-2`,
      status: "final",
      category: [{ text: "Radiology" }],
      code: { text: "Chest X-ray PA view" },
      subject,
      effectiveDateTime: new Date(Date.now() - 45 * 86400_000).toISOString(),
      conclusion: "Clear lung fields. No infiltrate.",
    },
  ];

  return { conditions, meds, allergies, vitals, labs, encounters, reports };
}

// Build a few appointments
export function buildAppointments(): FhirAppointment[] {
  const out: FhirAppointment[] = [];
  const today = new Date();
  today.setHours(9, 0, 0, 0);
  const slots = [
    { offsetMin: 0, durMin: 30, patient: "pat-001", prac: "prac-001", reason: "Diabetes review" },
    { offsetMin: 60, durMin: 20, patient: "pat-003", prac: "prac-004", reason: "Asthma follow-up" },
    { offsetMin: 120, durMin: 45, patient: "pat-004", prac: "prac-002", reason: "Heart failure check" },
    { offsetMin: 180, durMin: 30, patient: "pat-002", prac: "prac-002", reason: "Cardiology consult" },
    { offsetMin: 24 * 60, durMin: 30, patient: "pat-007", prac: "prac-001", reason: "RA flare assessment" },
    { offsetMin: 26 * 60, durMin: 20, patient: "pat-005", prac: "prac-001", reason: "Migraine consult" },
    { offsetMin: 48 * 60, durMin: 30, patient: "pat-006", prac: "prac-003", reason: "Thyroid follow-up" },
    { offsetMin: 50 * 60, durMin: 30, patient: "pat-008", prac: "prac-001", reason: "Anxiety review" },
  ];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const start = new Date(today.getTime() + s.offsetMin * 60_000);
    const end = new Date(start.getTime() + s.durMin * 60_000);
    out.push({
      resourceType: "Appointment",
      id: `appt-${i + 1}`,
      status: i === 2 ? "arrived" : "booked",
      start: start.toISOString(),
      end: end.toISOString(),
      minutesDuration: s.durMin,
      description: s.reason,
      participant: [
        { actor: { reference: `Patient/${s.patient}` }, status: "accepted" },
        { actor: { reference: `Practitioner/${s.prac}` }, status: "accepted" },
      ],
    });
  }
  return out;
}