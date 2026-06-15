export type HealixRole = "SuperAdmin" | "Admin" | "Doctor" | "Nurse" | "Receptionist" | "Patient";

export const ALL_HEALIX_ROLES: HealixRole[] = [
  "SuperAdmin",
  "Admin",
  "Doctor",
  "Nurse",
  "Receptionist",
  "Patient",
];

const PERMS: Record<HealixRole, string[]> = {
  SuperAdmin: ["*"],
  Admin: ["patient.read", "patient.write", "appt.write", "rx.write", "report.read", "settings.write"],
  Doctor: ["patient.read", "patient.write", "appt.write", "rx.write", "report.read", "ai.use"],
  Nurse: ["patient.read", "vitals.write", "appt.read", "ai.use"],
  Receptionist: ["patient.read", "appt.write"],
  Patient: ["self.read"],
};

export function can(role: HealixRole | undefined, permission: string): boolean {
  if (!role) return false;
  const list = PERMS[role] ?? [];
  return list.includes("*") || list.includes(permission);
}