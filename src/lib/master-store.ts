import { useEffect, useState } from "react";
import { practitioners } from "./mock-data";

export type Department = { id: string; name: string; head: string; description: string };
export type Employee = { id: string; name: string; email: string; phone: string; departmentId: string; designation: string; joinedAt: string };
export type Permission = { id: string; key: string; label: string; description: string };
export type Role = { id: string; name: string; description: string; permissionIds: string[] };
export type MasterUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  employeeId?: string;
  practitionerId?: string;
  active: boolean;
};

export type Organization = {
  id: string;
  name: string;
  hospitalIds: string[];
  branch: string;
  contact: string;
  active: boolean;
};

export type TimeSlot = {
  id: string;
  practitionerId: string;
  weekday: number; // 0=Sun .. 6=Sat
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  emergency: boolean;
  blocked: boolean;
};

const KEYS = {
  dept: "refera.master.departments",
  emp: "refera.master.employees",
  perm: "refera.master.permissions",
  role: "refera.master.roles",
  user: "refera.master.users",
  org: "refera.master.organizations",
  slot: "refera.master.timeslots",
} as const;

const SEED_PERMISSIONS: Permission[] = [
  { id: "pm1", key: "patients.view", label: "View patients", description: "See patient list and detail" },
  { id: "pm2", key: "patients.edit", label: "Edit patients", description: "Create or update patient records" },
  { id: "pm3", key: "referrals.view", label: "View referrals", description: "Browse triage queue" },
  { id: "pm4", key: "referrals.create", label: "Create referrals", description: "Submit new referrals" },
  { id: "pm5", key: "appointments.view", label: "View appointments", description: "See calendar" },
  { id: "pm6", key: "appointments.book", label: "Book appointments", description: "Schedule appointments" },
  { id: "pm7", key: "consultations.view", label: "View consultations", description: "Read outcome notes" },
  { id: "pm8", key: "admin.access", label: "Admin panel", description: "Access admin & masters" },
  { id: "pm9", key: "users.manage", label: "Manage users", description: "Create / edit users & roles" },
];

const SEED_ROLES: Role[] = [
  { id: "r1", name: "Administrator", description: "Full system access", permissionIds: SEED_PERMISSIONS.map((p) => p.id) },
  { id: "r2", name: "Doctor", description: "GP / Specialist clinical access — own patients only", permissionIds: ["pm1", "pm3", "pm4", "pm5", "pm6", "pm7"] },
  { id: "r3", name: "Front Desk", description: "Reception & scheduling", permissionIds: ["pm1", "pm5", "pm6"] },
  { id: "r4", name: "Read-only", description: "Audit / view only", permissionIds: ["pm1", "pm3", "pm5", "pm7"] },
];

const SEED_DEPARTMENTS: Department[] = [
  { id: "d1", name: "General Practice", head: "Dr. Eleanor Voss", description: "Primary care clinicians" },
  { id: "d2", name: "Cardiology", head: "Dr. Helena Cho", description: "Heart specialists" },
  { id: "d3", name: "Endocrinology", head: "Dr. Idris Bello", description: "Diabetes & hormones" },
  { id: "d4", name: "Administration", head: "Alex Romero", description: "Operations & front desk" },
];

const SEED_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Dr. Eleanor Voss", email: "eleanor.voss@riverside.health", phone: "+44 20 7946 1000", departmentId: "d1", designation: "Senior GP", joinedAt: "2019-04-01" },
  { id: "e2", name: "Dr. Samir Patel", email: "samir.patel@riverside.health", phone: "+44 20 7946 1001", departmentId: "d1", designation: "GP", joinedAt: "2021-09-15" },
  { id: "e3", name: "Dr. Helena Cho", email: "helena.cho@staldwyn.health", phone: "+44 20 7946 1002", departmentId: "d2", designation: "Consultant Cardiologist", joinedAt: "2017-01-10" },
  { id: "e4", name: "Alex Romero", email: "alex.romero@riverside.health", phone: "+44 20 7946 1003", departmentId: "d4", designation: "Practice Manager", joinedAt: "2020-06-22" },
];

const SEED_USERS: MasterUser[] = [
  { id: "us1", username: "admin", email: "admin@refera.health", fullName: "Admin · Refera", roleId: "r1", active: true },
  { id: "us2", username: "evoss", email: "eleanor.voss@riverside.health", fullName: "Dr. Eleanor Voss", roleId: "r2", employeeId: "e1", practitionerId: "u1", active: true },
  { id: "us3", username: "spatel", email: "samir.patel@riverside.health", fullName: "Dr. Samir Patel", roleId: "r2", employeeId: "e2", practitionerId: "u2", active: true },
  { id: "us4", username: "hcho", email: "helena.cho@staldwyn.health", fullName: "Dr. Helena Cho", roleId: "r2", employeeId: "e3", practitionerId: "u3", active: true },
  { id: "us5", username: "alex", email: "alex.romero@riverside.health", fullName: "Alex Romero", roleId: "r3", employeeId: "e4", active: true },
];

const SEED_ORGS: Organization[] = [
  { id: "o1", name: "Apex Healthcare Group", hospitalIds: ["h1"], branch: "Mumbai HQ", contact: "+91 22 4000 1100", active: true },
  { id: "o2", name: "BreathWell Network", hospitalIds: ["h2"], branch: "Delhi NCR", contact: "+91 11 4200 5500", active: true },
  { id: "o3", name: "MediCare Trust", hospitalIds: ["h3"], branch: "Bengaluru", contact: "+91 80 4900 7300", active: true },
  { id: "o4", name: "St. Aldwyn NHS Trust", hospitalIds: ["h4"], branch: "London", contact: "+44 20 7946 4400", active: false },
];

const SEED_SLOTS: TimeSlot[] = [
  { id: "ts1", practitionerId: "uc1", weekday: 1, start: "09:00", end: "13:00", emergency: false, blocked: false },
  { id: "ts2", practitionerId: "uc1", weekday: 3, start: "14:00", end: "17:00", emergency: false, blocked: false },
  { id: "ts3", practitionerId: "uc3", weekday: 2, start: "10:00", end: "16:00", emergency: true, blocked: false },
  { id: "ts4", practitionerId: "u3", weekday: 4, start: "09:00", end: "12:00", emergency: false, blocked: false },
];

function load<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}
function save<T>(key: string, val: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new Event("refera-master"));
}

export const masterStore = {
  departments: () => load<Department>(KEYS.dept, SEED_DEPARTMENTS),
  employees: () => load<Employee>(KEYS.emp, SEED_EMPLOYEES),
  permissions: () => load<Permission>(KEYS.perm, SEED_PERMISSIONS),
  roles: () => load<Role>(KEYS.role, SEED_ROLES),
  users: () => load<MasterUser>(KEYS.user, SEED_USERS),
  organizations: () => load<Organization>(KEYS.org, SEED_ORGS),
  timeslots: () => load<TimeSlot>(KEYS.slot, SEED_SLOTS),
  setDepartments: (v: Department[]) => save(KEYS.dept, v),
  setEmployees: (v: Employee[]) => save(KEYS.emp, v),
  setPermissions: (v: Permission[]) => save(KEYS.perm, v),
  setRoles: (v: Role[]) => save(KEYS.role, v),
  setUsers: (v: MasterUser[]) => save(KEYS.user, v),
  setOrganizations: (v: Organization[]) => save(KEYS.org, v),
  setTimeSlots: (v: TimeSlot[]) => save(KEYS.slot, v),
};

export function useMaster<T>(getter: () => T[]) {
  const [val, setVal] = useState<T[]>(() => getter());
  useEffect(() => {
    const refresh = () => setVal(getter());
    window.addEventListener("refera-master", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("refera-master", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [getter]);
  return val;
}

/** Resolve a logged-in AuthUser email to a practitionerId (for doctor scoping). */
export function resolvePractitionerId(email: string): string | undefined {
  if (!email) return undefined;
  const users = masterStore.users();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (found?.practitionerId) return found.practitionerId;
  // fallback: try practitioner name slug
  const local = email.split("@")[0].toLowerCase();
  const match = practitioners.find((p) =>
    p.name.toLowerCase().replace(/^dr\.\s+/, "").replace(/\s+/g, "").includes(local) ||
    p.name.toLowerCase().replace(/[^a-z]/g, "").startsWith(local.replace(/[^a-z]/g, "")),
  );
  return match?.id;
}

export function newId(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}
