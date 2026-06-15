import { queryOptions } from "@tanstack/react-query";
import { getFhirClient } from "./fhir";

export const healixKeys = {
  all: ["healix"] as const,
  kpis: () => [...healixKeys.all, "kpis"] as const,
  patients: (search?: string) => [...healixKeys.all, "patients", search ?? ""] as const,
  patient: (id: string) => [...healixKeys.all, "patient", id] as const,
  vitals: (id: string) => [...healixKeys.all, "vitals", id] as const,
  labs: (id: string) => [...healixKeys.all, "labs", id] as const,
  conditions: (id: string) => [...healixKeys.all, "conditions", id] as const,
  meds: (id: string) => [...healixKeys.all, "meds", id] as const,
  allergies: (id: string) => [...healixKeys.all, "allergies", id] as const,
  encounters: (id: string) => [...healixKeys.all, "encounters", id] as const,
  reports: (id: string) => [...healixKeys.all, "reports", id] as const,
  practitioners: () => [...healixKeys.all, "practitioners"] as const,
  appointments: (range?: { from?: string; to?: string }) =>
    [...healixKeys.all, "appointments", range?.from ?? "", range?.to ?? ""] as const,
};

export const kpisQuery = () =>
  queryOptions({
    queryKey: healixKeys.kpis(),
    queryFn: () => getFhirClient().getDashboardKpis(),
  });

export const patientsQuery = (search?: string) =>
  queryOptions({
    queryKey: healixKeys.patients(search),
    queryFn: () => getFhirClient().listPatients({ search }),
  });

export const patientQuery = (id: string) =>
  queryOptions({ queryKey: healixKeys.patient(id), queryFn: () => getFhirClient().getPatient(id) });

export const vitalsQuery = (id: string) =>
  queryOptions({
    queryKey: healixKeys.vitals(id),
    queryFn: () => getFhirClient().listObservations(id, "vital-signs"),
  });

export const labsQuery = (id: string) =>
  queryOptions({
    queryKey: healixKeys.labs(id),
    queryFn: () => getFhirClient().listObservations(id, "laboratory"),
  });

export const conditionsQuery = (id: string) =>
  queryOptions({ queryKey: healixKeys.conditions(id), queryFn: () => getFhirClient().listConditions(id) });

export const medsQuery = (id: string) =>
  queryOptions({ queryKey: healixKeys.meds(id), queryFn: () => getFhirClient().listMedications(id) });

export const allergiesQuery = (id: string) =>
  queryOptions({ queryKey: healixKeys.allergies(id), queryFn: () => getFhirClient().listAllergies(id) });

export const encountersQuery = (id: string) =>
  queryOptions({ queryKey: healixKeys.encounters(id), queryFn: () => getFhirClient().listEncounters(id) });

export const reportsQuery = (id: string) =>
  queryOptions({
    queryKey: healixKeys.reports(id),
    queryFn: () => getFhirClient().listDiagnosticReports(id),
  });

export const practitionersQuery = () =>
  queryOptions({ queryKey: healixKeys.practitioners(), queryFn: () => getFhirClient().listPractitioners() });

export const appointmentsQuery = (range?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: healixKeys.appointments(range),
    queryFn: () => getFhirClient().listAppointments(range),
  });