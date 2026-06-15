import type { FhirClient } from "./client";
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
import {
  MOCK_PRACTITIONERS,
  MOCK_SEEDS,
  ageFrom,
  buildAppointments,
  buildPatient,
  buildPatientBundle,
} from "./mock-data";

// In-memory caches so derived data is stable across calls within a session.
const _patients = new Map<string, FhirPatient>();
const _bundles = new Map<string, ReturnType<typeof buildPatientBundle>>();
const _appointments: FhirAppointment[] = buildAppointments();

function ensurePatient(id: string) {
  if (!_patients.has(id)) {
    const seed = MOCK_SEEDS.find((s) => s.id === id);
    if (!seed) return null;
    _patients.set(id, buildPatient(seed));
    _bundles.set(id, buildPatientBundle(seed));
  }
  return _patients.get(id) ?? null;
}

function ensureBundle(id: string) {
  ensurePatient(id);
  return _bundles.get(id);
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export const mockFhirClient: FhirClient = {
  async listPatients({ search, limit } = {}) {
    const all = MOCK_SEEDS.map<PatientSummary>((s) => {
      ensurePatient(s.id);
      const bundle = _bundles.get(s.id)!;
      const lastEnc = bundle.encounters[0]?.period.start;
      return {
        id: s.id,
        fullName: `${s.given} ${s.family}`,
        age: ageFrom(s.birthDate),
        gender: s.gender,
        mrn: `MRN-${s.id.slice(-4).toUpperCase()}`,
        phone: "+91 90000 0000",
        email: `${s.given.toLowerCase()}.${s.family.toLowerCase()}@example.com`,
        city: s.city,
        bloodType: s.blood,
        codeStatus: s.codeStatus ?? "Full Code",
        lastVisit: lastEnc,
        riskScore: s.riskScore,
        activeConditions: bundle.conditions.length,
        activeMedications: bundle.meds.length,
      };
    });
    const filtered = search
      ? all.filter((p) =>
          (p.fullName + " " + p.mrn + " " + (p.city ?? "")).toLowerCase().includes(search.toLowerCase()),
        )
      : all;
    return delay(limit ? filtered.slice(0, limit) : filtered);
  },

  async getPatient(id) {
    return delay(ensurePatient(id));
  },

  async listEncounters(id) {
    return delay<FhirEncounter[]>(ensureBundle(id)?.encounters ?? []);
  },
  async listObservations(id, category) {
    const b = ensureBundle(id);
    if (!b) return delay<FhirObservation[]>([]);
    if (category === "vital-signs") return delay(b.vitals);
    if (category === "laboratory") return delay(b.labs);
    return delay([...b.vitals, ...b.labs]);
  },
  async listConditions(id) {
    return delay<FhirCondition[]>(ensureBundle(id)?.conditions ?? []);
  },
  async listMedications(id) {
    return delay<FhirMedicationRequest[]>(ensureBundle(id)?.meds ?? []);
  },
  async listAllergies(id) {
    return delay<FhirAllergyIntolerance[]>(ensureBundle(id)?.allergies ?? []);
  },
  async listDiagnosticReports(id) {
    return delay<FhirDiagnosticReport[]>(ensureBundle(id)?.reports ?? []);
  },

  async listPractitioners() {
    return delay<FhirPractitioner[]>(MOCK_PRACTITIONERS);
  },
  async getPractitioner(id) {
    return delay(MOCK_PRACTITIONERS.find((p) => p.id === id) ?? null);
  },

  async listAppointments({ from, to, patientId } = {}) {
    let res = _appointments.slice();
    if (from) res = res.filter((a) => a.start >= from);
    if (to) res = res.filter((a) => a.start <= to);
    if (patientId)
      res = res.filter((a) =>
        a.participant.some((p) => p.actor.reference === `Patient/${patientId}`),
      );
    return delay(res);
  },

  async createAppointment(input) {
    const id = `appt-${_appointments.length + 1}`;
    const next: FhirAppointment = { resourceType: "Appointment", id, ...input };
    _appointments.push(next);
    return delay(next);
  },

  async getDashboardKpis() {
    return delay({
      activePatients: MOCK_SEEDS.length,
      appointmentsToday: _appointments.filter((a) =>
        a.start.startsWith(new Date().toISOString().slice(0, 10)),
      ).length,
      criticalAlerts: 3,
      revenueMtd: 482_500,
      bedOccupancy: 78,
      avgWaitMinutes: 12,
    });
  },
};