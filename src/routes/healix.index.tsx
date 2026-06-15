import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  HeartPulse,
  IndianRupee,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appointmentsQuery, kpisQuery, patientsQuery } from "@/lib/healix/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/healix/")({
  head: () => ({
    meta: [
      { title: "HEALIX AI — Clinical Dashboard" },
      { name: "description", content: "Live healthcare insights, vitals, appointments and AI-powered clinical intelligence on FHIR R4." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(kpisQuery());
    context.queryClient.ensureQueryData(patientsQuery());
    context.queryClient.ensureQueryData(appointmentsQuery());
  },
  component: HealixDashboard,
});

const visitsTrend = [
  { d: "Mon", v: 38, a: 28 },
  { d: "Tue", v: 46, a: 35 },
  { d: "Wed", v: 52, a: 41 },
  { d: "Thu", v: 44, a: 32 },
  { d: "Fri", v: 58, a: 47 },
  { d: "Sat", v: 31, a: 22 },
  { d: "Sun", v: 19, a: 14 },
];

const deptUtilization = [
  { dept: "Cardio", v: 82 },
  { dept: "Endo", v: 64 },
  { dept: "Pulm", v: 71 },
  { dept: "Neuro", v: 58 },
  { dept: "Ortho", v: 47 },
  { dept: "Peds", v: 39 },
];

function HealixDashboard() {
  const { data: kpis } = useSuspenseQuery(kpisQuery());
  const { data: patients } = useSuspenseQuery(patientsQuery());
  const { data: appts } = useSuspenseQuery(appointmentsQuery());

  const todayAppts = appts.filter((a) => a.start.startsWith(new Date().toISOString().slice(0, 10)));
  const critical = patients.filter((p) => p.riskScore >= 70).slice(0, 4);

  return (
    <HealixShell
      title="Clinical Dashboard"
      subtitle="Real-time view of operations, vitals and care quality"
      actions={
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
          <Link to="/healix/ai">
            <Sparkles className="h-4 w-4" /> Ask AI
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Kpi icon={Users} label="Active patients" value={kpis.activePatients.toLocaleString()} trend="+12% MoM" tone="info" />
        <Kpi icon={CalendarClock} label="Appointments today" value={kpis.appointmentsToday} trend="4 awaiting" tone="info" />
        <Kpi icon={AlertTriangle} label="Critical alerts" value={kpis.criticalAlerts} trend="2 unresolved" tone="danger" />
        <Kpi icon={Activity} label="Bed occupancy" value={`${kpis.bedOccupancy}%`} trend="+3 since 8am" tone="success" />
        <Kpi icon={HeartPulse} label="Avg wait" value={`${kpis.avgWaitMinutes}m`} trend="−2m vs last wk" tone="success" />
        <Kpi icon={IndianRupee} label="Revenue MTD" value={`₹${(kpis.revenueMtd / 1000).toFixed(0)}k`} trend="+8.4%" tone="info" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Visit volume — last 7 days</CardTitle>
            <Badge variant="secondary" className="text-[10px]">All clinics</Badge>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitsTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.16 215)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.78 0.16 215)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 235)", border: "1px solid oklch(0.32 0.02 230 / 45%)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.78 0.16 215)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="a" stroke="oklch(0.72 0.18 175)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today's schedule</CardTitle>
            <Link to="/healix/appointments" className="text-xs text-primary inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5 max-h-[260px] overflow-auto">
            {todayAppts.length === 0 && (
              <div className="text-xs text-muted-foreground">No appointments today.</div>
            )}
            {todayAppts.map((a) => {
              const time = new Date(a.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const pid = a.participant.find((p) => p.actor.reference.startsWith("Patient/"))?.actor.reference.split("/")[1];
              const p = patients.find((x) => x.id === pid);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
                  <div className="w-12 text-xs font-medium tabular-nums">{time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p?.fullName ?? "Patient"}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{a.description}</div>
                  </div>
                  <StatusPill status={a.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Department utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptUtilization}>
                <XAxis dataKey="dept" stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 235)", border: "1px solid oklch(0.32 0.02 230 / 45%)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="v" fill="oklch(0.74 0.16 250)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[oklch(var(--status-danger))]" />
              High-risk patients
            </CardTitle>
            <Link to="/healix/patients" className="text-xs text-primary inline-flex items-center gap-1">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {critical.map((p) => (
              <Link
                key={p.id}
                to="/healix/patients/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-accent/40 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-xs font-semibold">
                  {p.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.fullName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.age}y · {p.gender} · {p.activeConditions} active conditions
                  </div>
                </div>
                <RiskPill score={p.riskScore} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 border-primary/30 bg-gradient-surface">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">AI insight</div>
            <p className="text-sm text-muted-foreground">
              3 patients due for HbA1c follow-up this week. 2 prescriptions show potential interaction. Open the AI Assistant for a prioritized triage list.
            </p>
          </div>
          <Button asChild variant="outline" className="self-stretch sm:self-auto">
            <Link to="/healix/ai">
              <Stethoscope className="h-4 w-4 mr-2" /> Open AI Assistant
            </Link>
          </Button>
        </CardContent>
      </Card>
    </HealixShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  trend: string;
  tone: "info" | "success" | "danger";
}) {
  const tones = {
    info: "text-[oklch(var(--status-info))] bg-[var(--status-info-bg)]",
    success: "text-[oklch(var(--status-success))] bg-[var(--status-success-bg)]",
    danger: "text-[oklch(var(--status-danger))] bg-[var(--status-danger-bg)]",
  } as const;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn("h-9 w-9 rounded-lg grid place-items-center", tones[tone])}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[10px] text-muted-foreground">{trend}</span>
        </div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    booked: "bg-[var(--status-info-bg)] text-[oklch(var(--status-info))]",
    arrived: "bg-[var(--status-success-bg)] text-[oklch(var(--status-success))]",
    fulfilled: "bg-[var(--status-success-bg)] text-[oklch(var(--status-success))]",
    cancelled: "bg-[var(--status-danger-bg)] text-[oklch(var(--status-danger))]",
    pending: "bg-[var(--status-warn-bg)] text-[oklch(var(--status-warn))]",
  };
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide", map[status] ?? "bg-muted text-muted-foreground")}>{status}</span>;
}

export function RiskPill({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-[var(--status-danger-bg)] text-[oklch(var(--status-danger))]"
      : score >= 40
        ? "bg-[var(--status-warn-bg)] text-[oklch(var(--status-warn))]"
        : "bg-[var(--status-success-bg)] text-[oklch(var(--status-success))]";
  return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums", tone)}>R{score}</span>;
}