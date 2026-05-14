import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldAlert, Users, Stethoscope, Inbox, CalendarDays, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import {
  appointments,
  getPatient,
  getPractitioner,
  patients,
  practitioners,
  referrals,
  statusMeta,
} from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Refera" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();

  const fPatients = useMemo(
    () =>
      patients.filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.mrn.toLowerCase().includes(term) ||
          p.problems.join(" ").toLowerCase().includes(term),
      ),
    [term],
  );
  const fDoctors = useMemo(
    () =>
      practitioners.filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          (p.specialty ?? "").toLowerCase().includes(term) ||
          p.organization.toLowerCase().includes(term) ||
          p.role.toLowerCase().includes(term),
      ),
    [term],
  );
  const fReferrals = useMemo(
    () =>
      referrals.filter((r) => {
        if (!term) return true;
        const p = getPatient(r.patientId);
        const sp = getPractitioner(r.toSpecialistId);
        return (
          r.id.toLowerCase().includes(term) ||
          r.specialty.toLowerCase().includes(term) ||
          (p?.name.toLowerCase().includes(term) ?? false) ||
          (sp?.name.toLowerCase().includes(term) ?? false)
        );
      }),
    [term],
  );
  const fAppts = useMemo(
    () =>
      appointments.filter((a) => {
        if (!term) return true;
        const p = getPatient(a.patientId);
        const sp = getPractitioner(a.specialistId);
        return (
          (p?.name.toLowerCase().includes(term) ?? false) ||
          (sp?.name.toLowerCase().includes(term) ?? false) ||
          a.location.toLowerCase().includes(term)
        );
      }),
    [term],
  );

  const stats = [
    { label: "Patients", value: patients.length, icon: Users },
    { label: "Practitioners", value: practitioners.length, icon: Stethoscope },
    { label: "Referrals", value: referrals.length, icon: Inbox },
    { label: "Appointments", value: appointments.length, icon: CalendarDays },
  ];

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Admin panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Full visibility into patients, doctors, referrals and appointments.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search across all data…"
              className="pl-9 h-9 bg-input/60"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border-border/60 bg-card/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold tabular-nums">{s.value}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="patients">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-4">
            <Card className="glass-panel border-border/60">
              <CardHeader><CardTitle className="text-base">All patients ({fPatients.length})</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 font-medium">Patient</th>
                      <th className="text-left px-5 py-3 font-medium">MRN</th>
                      <th className="text-left px-5 py-3 font-medium">DOB</th>
                      <th className="text-left px-5 py-3 font-medium">Phone</th>
                      <th className="text-left px-5 py-3 font-medium">Problems</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/40">
                        <td className="px-5 py-3 font-medium">{p.name}</td>
                        <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{p.mrn}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.dob}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.phone}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.problems.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="mt-4">
            <Card className="glass-panel border-border/60">
              <CardHeader><CardTitle className="text-base">All practitioners ({fDoctors.length})</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 font-medium">Name</th>
                      <th className="text-left px-5 py-3 font-medium">Role</th>
                      <th className="text-left px-5 py-3 font-medium">Specialty</th>
                      <th className="text-left px-5 py-3 font-medium">Organisation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fDoctors.map((d) => (
                      <tr key={d.id} className="hover:bg-accent/40">
                        <td className="px-5 py-3 font-medium">{d.name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{d.role}</td>
                        <td className="px-5 py-3 text-muted-foreground">{d.specialty ?? "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{d.organization}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="mt-4">
            <Card className="glass-panel border-border/60">
              <CardHeader><CardTitle className="text-base">All referrals ({fReferrals.length})</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 font-medium">ID</th>
                      <th className="text-left px-5 py-3 font-medium">Patient</th>
                      <th className="text-left px-5 py-3 font-medium">Specialist</th>
                      <th className="text-left px-5 py-3 font-medium">Specialty</th>
                      <th className="text-left px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fReferrals.map((r) => {
                      const p = getPatient(r.patientId);
                      const sp = getPractitioner(r.toSpecialistId);
                      const sm = statusMeta(r.status);
                      return (
                        <tr key={r.id} className="hover:bg-accent/40">
                          <td className="px-5 py-3 font-mono text-xs">
                            <Link to="/referrals/$id" params={{ id: r.id }} className="text-primary hover:underline">
                              {r.id}
                            </Link>
                          </td>
                          <td className="px-5 py-3 font-medium">{p?.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{sp?.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{r.specialty}</td>
                          <td className="px-5 py-3"><StatusBadge tone={sm.tone}>{sm.label}</StatusBadge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-4">
            <Card className="glass-panel border-border/60">
              <CardHeader><CardTitle className="text-base">All appointments ({fAppts.length})</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 font-medium">When</th>
                      <th className="text-left px-5 py-3 font-medium">Patient</th>
                      <th className="text-left px-5 py-3 font-medium">Specialist</th>
                      <th className="text-left px-5 py-3 font-medium">Location</th>
                      <th className="text-left px-5 py-3 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fAppts.map((a) => {
                      const p = getPatient(a.patientId);
                      const sp = getPractitioner(a.specialistId);
                      const d = new Date(a.startsAt);
                      return (
                        <tr key={a.id} className="hover:bg-accent/40">
                          <td className="px-5 py-3 tabular-nums">
                            {d.toLocaleDateString()} · {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-5 py-3 font-medium">{p?.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{sp?.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{a.location}</td>
                          <td className="px-5 py-3 text-muted-foreground">{a.durationMin} min</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}