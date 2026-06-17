import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Inbox, LogOut, Search, ShieldAlert, Stethoscope, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchActivity, fetchAppointments, fetchDoctors, fetchPatients, fetchReferrals, fetchUserSessions, formatMrn, priorityMeta, referralCode, statusMeta } from "@/lib/app-data";
import { useRealtimeTables } from "@/lib/realtime";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Refera" }] }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  useRealtimeTables(["patients", "doctors", "referrals", "appointments", "user_activity", "user_sessions"], [["patients"], ["doctors"], ["referrals"], ["appointments"], ["activity-feed"], ["user-sessions"]]);
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });
  const { data: referrals = [] } = useQuery({ queryKey: ["referrals"], queryFn: fetchReferrals });
  const { data: appointments = [] } = useQuery({ queryKey: ["appointments"], queryFn: fetchAppointments });
  const { data: activity = [] } = useQuery({ queryKey: ["activity-feed"], queryFn: fetchActivity });
  const { data: sessions = [] } = useQuery({ queryKey: ["user-sessions"], queryFn: fetchUserSessions });

  const endSession = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("user_sessions").update({ logout_at: now, last_active_at: now }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Session marked logged out");
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["user-sessions"] }),
      qc.invalidateQueries({ queryKey: ["activity-feed"] }),
    ]);
  };

  const fPatients = useMemo(() => patients.filter((p) => !term || `${p.name} ${formatMrn(p)} ${p.phone ?? ""} ${(p.problems ?? []).join(" ")}`.toLowerCase().includes(term)), [patients, term]);
  const fDoctors = useMemo(() => doctors.filter((d) => !term || `${d.name} ${d.email ?? ""} ${d.specialty ?? ""} ${d.status}`.toLowerCase().includes(term)), [doctors, term]);
  const fReferrals = useMemo(() => referrals.filter((r) => {
    if (!term) return true;
    const p = patients.find((x) => x.id === r.patient_id);
    const d = doctors.find((x) => x.id === r.to_doctor_id);
    return `${referralCode(r)} ${p?.name ?? ""} ${d?.name ?? ""} ${r.specialty ?? ""} ${r.reason ?? ""}`.toLowerCase().includes(term);
  }), [doctors, patients, referrals, term]);
  const fAppts = useMemo(() => appointments.filter((a) => {
    if (!term) return true;
    const p = patients.find((x) => x.id === a.patient_id);
    const d = doctors.find((x) => x.id === a.doctor_id);
    return `${p?.name ?? ""} ${d?.name ?? ""} ${a.location ?? ""} ${a.status}`.toLowerCase().includes(term);
  }), [appointments, doctors, patients, term]);

  const stats = [
    { label: "Patients", value: patients.length, icon: Users },
    { label: "Doctors", value: doctors.length, icon: Stethoscope },
    { label: "Referrals", value: referrals.length, icon: Inbox },
    { label: "Appointments", value: appointments.length, icon: CalendarDays },
  ];

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Admin panel</h1><p className="text-sm text-muted-foreground mt-1">Live database view for users, patients, doctors, referrals, appointments and sessions.</p></div>
          <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search live data…" className="pl-9 h-9 bg-input/60" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{stats.map((s) => { const Icon = s.icon; return <Card key={s.label} className="border-border/60 bg-card/60"><CardContent className="p-4 flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center text-primary"><Icon className="h-4 w-4" /></div><div><div className="text-xl font-semibold tabular-nums">{s.value}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div></div></CardContent></Card>; })}</div>
        <Tabs defaultValue="sessions"><TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full sm:w-auto"><TabsTrigger value="sessions">Sessions</TabsTrigger><TabsTrigger value="patients">Patients</TabsTrigger><TabsTrigger value="doctors">Doctors</TabsTrigger><TabsTrigger value="referrals">Referrals</TabsTrigger><TabsTrigger value="appointments">Appointments</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
          <TabsContent value="sessions" className="mt-4"><DataTable title={`Live sessions (${sessions.length})`} cols={["User", "Login", "Logout", "Duration", "Status"]}>{sessions.map((s) => { const active = !s.logout_at; return <tr key={s.id} className="hover:bg-accent/40"><td className="px-5 py-3 font-medium">{s.user_email ?? "Unknown user"}</td><td className="px-5 py-3 text-muted-foreground tabular-nums">{new Date(s.login_at).toLocaleString()}</td><td className="px-5 py-3 text-muted-foreground tabular-nums">{s.logout_at ? new Date(s.logout_at).toLocaleString() : "—"}</td><td className="px-5 py-3 text-muted-foreground tabular-nums">{formatDuration(s.duration_seconds ?? (active ? Math.floor((Date.now() - new Date(s.login_at).getTime()) / 1000) : null))}</td><td className="px-5 py-3"><StatusBadge tone={active ? "success" : "neutral"}>{active ? "Active" : "Logged out"}</StatusBadge></td></tr>; })}</DataTable></TabsContent>
          <TabsContent value="patients" className="mt-4"><DataTable title={`All patients (${fPatients.length})`} cols={["Patient", "MRN", "DOB", "Phone", "Problems"]}>{fPatients.map((p) => <tr key={p.id} className="hover:bg-accent/40"><td className="px-5 py-3 font-medium">{p.name}</td><td className="px-5 py-3 text-muted-foreground font-mono text-xs">{formatMrn(p)}</td><td className="px-5 py-3 text-muted-foreground">{p.dob ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{p.phone ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{(p.problems ?? []).join(", ") || "—"}</td></tr>)}</DataTable></TabsContent>
          <TabsContent value="doctors" className="mt-4"><DataTable title={`All doctors (${fDoctors.length})`} cols={["Name", "Email", "Specialty", "Status"]}>{fDoctors.map((d) => <tr key={d.id} className="hover:bg-accent/40"><td className="px-5 py-3 font-medium">{d.name}</td><td className="px-5 py-3 text-muted-foreground">{d.email ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{d.specialty ?? "—"}</td><td className="px-5 py-3"><StatusBadge tone={statusMeta(d.status).tone}>{statusMeta(d.status).label}</StatusBadge></td></tr>)}</DataTable></TabsContent>
          <TabsContent value="referrals" className="mt-4"><DataTable title={`All referrals (${fReferrals.length})`} cols={["ID", "Patient", "Doctor", "Priority", "Status"]}>{fReferrals.map((r) => { const p = patients.find((x) => x.id === r.patient_id); const d = doctors.find((x) => x.id === r.to_doctor_id); const sm = statusMeta(r.status); const pm = priorityMeta(r.priority); return <tr key={r.id} className="hover:bg-accent/40"><td className="px-5 py-3 font-mono text-xs text-primary"><Link to="/referrals/$id" params={{ id: r.id }}>{referralCode(r)}</Link></td><td className="px-5 py-3 font-medium">{p?.name ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{d?.name ?? "—"}</td><td className="px-5 py-3"><StatusBadge tone={pm.tone} dot={false}>{pm.label}</StatusBadge></td><td className="px-5 py-3"><StatusBadge tone={sm.tone}>{sm.label}</StatusBadge></td></tr>; })}</DataTable></TabsContent>
          <TabsContent value="appointments" className="mt-4"><DataTable title={`All appointments (${fAppts.length})`} cols={["When", "Patient", "Doctor", "Location", "Duration"]}>{fAppts.map((a) => { const p = patients.find((x) => x.id === a.patient_id); const d = doctors.find((x) => x.id === a.doctor_id); return <tr key={a.id} className="hover:bg-accent/40"><td className="px-5 py-3 tabular-nums">{new Date(a.starts_at).toLocaleString()}</td><td className="px-5 py-3 font-medium">{p?.name ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{d?.name ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{a.location ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{a.duration_min} min</td></tr>; })}</DataTable></TabsContent>
          <TabsContent value="activity" className="mt-4"><DataTable title={`Recent activity (${activity.length})`} cols={["When", "User", "Event", "Action", "Route"]}>{activity.map((a) => <tr key={a.id} className="hover:bg-accent/40"><td className="px-5 py-3 tabular-nums text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td><td className="px-5 py-3 font-medium">{a.user_name ?? a.user_email ?? "Unknown"}</td><td className="px-5 py-3 text-muted-foreground">{a.event_type}</td><td className="px-5 py-3 text-muted-foreground">{a.action ?? "—"}</td><td className="px-5 py-3 text-muted-foreground">{a.route ?? "—"}</td></tr>)}</DataTable></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function DataTable({ title, cols, children }: { title: string; cols: string[]; children: React.ReactNode }) {
  return <Card className="glass-panel border-border/60"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm min-w-[760px]"><thead className="text-[11px] uppercase tracking-wider text-muted-foreground"><tr className="border-b border-border">{cols.map((c) => <th key={c} className="text-left px-5 py-3 font-medium">{c}</th>)}</tr></thead><tbody className="divide-y divide-border">{children}</tbody></table></CardContent></Card>;
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}