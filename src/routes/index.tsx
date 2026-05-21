import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CloudSun,
  Inbox,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getPatient,
  getPractitioner,
  statusMeta,
  urgencyMeta,
} from "@/lib/mock-data";
import { useAuth, DEFAULT_USER } from "@/lib/auth";
import { scopedAppointments, scopedPatients, scopedReferrals } from "@/lib/scoped";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Refera" },
      {
        name: "description",
        content:
          "Live overview of referrals, triage queue, and upcoming appointments — built on FHIR R4.",
      },
    ],
  }),
  component: Dashboard,
});

const referralVolume = [
  { day: "Mon", value: 18, accepted: 12 },
  { day: "Tue", value: 24, accepted: 17 },
  { day: "Wed", value: 31, accepted: 22 },
  { day: "Thu", value: 27, accepted: 20 },
  { day: "Fri", value: 36, accepted: 28 },
  { day: "Sat", value: 14, accepted: 10 },
  { day: "Sun", value: 9, accepted: 6 },
];

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Working late";
}

function Dashboard() {
  const { user } = useAuth();
  const active = user ?? DEFAULT_USER;
  const firstName = active.name.replace(/^Dr\.\s+/, "").split(" ")[0];
  const now = useNow();
  const referrals = scopedReferrals(user);
  const appointments = scopedAppointments(user);
  const patients = scopedPatients(user);

  const open = referrals.filter((r) =>
    ["submitted", "accepted", "scheduled"].includes(r.status),
  );
  const urgent = referrals.filter(
    (r) => r.urgency !== "routine" && r.status !== "completed",
  );
  const completed = referrals.filter((r) => r.status === "completed");
  const recent = useMemo(
    () =>
      [...referrals]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 5),
    [],
  );
  const upcoming = useMemo(
    () =>
      [...appointments]
        .filter((a) => +new Date(a.startsAt) >= Date.now() - 86400000)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
        .slice(0, 4),
    [],
  );

  const insightsData = [
    { name: "Acceptance", value: 86, fill: "oklch(0.78 0.16 210)" },
    { name: "On-time", value: 92, fill: "oklch(0.72 0.18 175)" },
    { name: "Closed-loop", value: 74, fill: "oklch(0.74 0.16 250)" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-5 sm:px-6 sm:py-6">
        {/* Hero + Insights */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Hero greeting */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-hero p-5 sm:p-7 shadow-elegant lg:col-span-2">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full opacity-20 blur-3xl"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Live workspace
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl leading-tight text-foreground">
                    {now ? greetingFor(now) : "Welcome back"},{" "}
                    <span className="text-gradient-primary">{firstName}</span>
                  </h1>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {open.length} open referrals · {urgent.length} need urgent triage today.
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <CloudSun className="h-4 w-4 text-primary" />
                    <span>17°C · Light cloud</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {now
                      ? now.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <div className="font-display text-4xl sm:text-5xl md:text-6xl tabular-nums leading-none text-foreground">
                    {now
                      ? now
                          .toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                          .replace(/^0/, "")
                      : "--:--"}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Local time · {active.organization}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/referrals/new">
                    <Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow">
                      <Activity className="h-4 w-4" /> New referral
                    </Button>
                  </Link>
                  <Link to="/referrals">
                    <Button variant="outline" className="gap-1.5 border-border/60">
                      Triage queue <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <Card className="border-border/60 bg-card/60 shadow-elegant backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Insights</CardTitle>
                  <p className="text-xs text-muted-foreground">Performance analytics</p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  30d
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="performance">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>
                <TabsContent value="performance" className="mt-4 space-y-4">
                  <div className="relative h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="40%"
                        outerRadius="100%"
                        barSize={10}
                        data={insightsData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar background dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                      <div className="text-center">
                        <div className="font-display text-3xl">86%</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Acceptance
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {insightsData.map((d) => (
                      <div key={d.name} className="flex items-center gap-3 text-sm">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: d.fill }}
                        />
                        <span className="flex-1 text-muted-foreground">{d.name}</span>
                        <span className="font-mono tabular-nums text-foreground">
                          {d.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="trends" className="mt-4">
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="mx-auto mb-2 h-6 w-6 text-primary" />
                      Acceptance up 8% week-over-week.
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="Total referrals"
            value={referrals.length}
            delta="+3"
            deltaTone="up"
            icon={Inbox}
          />
          <KpiTile
            label="Avg. response time"
            value="32 min"
            delta="0%"
            deltaTone="flat"
            icon={Clock3}
          />
          <KpiTile
            label="Active patients"
            value={patients.length.toString().padStart(2, "0")}
            delta="+12%"
            deltaTone="up"
            icon={Activity}
          />
          <KpiTile
            label="Closed-loop rate"
            value="78%"
            delta="+5%"
            deltaTone="up"
            icon={CheckCircle2}
          />
        </div>

        {/* Volume chart + Calendar */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/60 shadow-elegant backdrop-blur lg:col-span-2">
            <CardHeader className="flex flex-row items-end justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-base">Referral volume</CardTitle>
                <p className="text-xs text-muted-foreground">Submitted vs accepted · last 7 days</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <Legend dot="oklch(0.78 0.16 210)" label="Submitted" />
                <Legend dot="oklch(0.72 0.18 175)" label="Accepted" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={referralVolume} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.78 0.16 210)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.78 0.16 210)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.18 175)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.72 0.18 175)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      stroke="oklch(0.6 0.02 230)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <YAxis
                      stroke="oklch(0.6 0.02 230)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.02 235)",
                        border: "1px solid oklch(0.32 0.02 230 / 60%)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "oklch(0.97 0.008 220)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="oklch(0.78 0.16 210)"
                      strokeWidth={2}
                      fill="url(#g1)"
                    />
                    <Area
                      type="monotone"
                      dataKey="accepted"
                      stroke="oklch(0.72 0.18 175)"
                      strokeWidth={2}
                      fill="url(#g2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <MiniCalendar />
        </div>

        {/* Recent + Upcoming */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/60 shadow-elegant backdrop-blur lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent referrals</CardTitle>
                <p className="text-xs text-muted-foreground">Most recently updated</p>
              </div>
              <Link
                to="/referrals"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {recent.map((r) => {
                  const p = getPatient(r.patientId)!;
                  const sp = getPractitioner(r.toSpecialistId)!;
                  const sm = statusMeta(r.status);
                  const um = urgencyMeta(r.urgency);
                  return (
                    <Link
                      key={r.id}
                      to="/referrals/$id"
                      params={{ id: r.id }}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 transition-colors hover:bg-accent/40"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground shrink-0">
                            · {r.id}
                          </div>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {r.specialty} → {sp.name} · {r.reason}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap sm:hidden">
                          <StatusBadge tone={um.tone}>{um.label}</StatusBadge>
                          <StatusBadge tone={sm.tone}>{sm.label}</StatusBadge>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <StatusBadge tone={um.tone}>{um.label}</StatusBadge>
                        <StatusBadge tone={sm.tone}>{sm.label}</StatusBadge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-elegant backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Upcoming appointments</CardTitle>
                <p className="text-xs text-muted-foreground">Next 7 days</p>
              </div>
              <Link
                to="/appointments"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Calendar <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {upcoming.map((a) => {
                  const p = getPatient(a.patientId)!;
                  const sp = getPractitioner(a.specialistId)!;
                  const d = new Date(a.startsAt);
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-12 rounded-md border border-border/60 bg-background/40 py-1 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {d.toLocaleDateString(undefined, { month: "short" })}
                        </div>
                        <div className="mt-0.5 text-base font-semibold leading-none">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {sp.specialty} · {sp.name}
                        </div>
                      </div>
                      <div className="font-mono text-xs tabular-nums text-muted-foreground">
                        {d.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function KpiTile({
  label,
  value,
  delta,
  deltaTone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  delta: string;
  deltaTone: "up" | "down" | "flat";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass =
    deltaTone === "up"
      ? "text-[oklch(0.72_0.18_175)]"
      : deltaTone === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/60 shadow-elegant backdrop-blur transition-all hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition-colors group-hover:text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-background/40 px-2 py-0.5 text-[11px] font-medium",
              toneClass,
            )}
          >
            {deltaTone === "up" ? "↗" : deltaTone === "down" ? "↘" : "→"} {delta}
          </div>
        </div>
        <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 font-display text-3xl text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

function MiniCalendar() {
  const { user } = useAuth();
  const appointments = scopedAppointments(user);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = new Date();
  const [selected, setSelected] = useState<number | null>(today.getDate());

  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startDow = monthStart.getDay();
  const totalDays = monthEnd.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const apptDays = new Set(
    appointments
      .map((a) => new Date(a.startsAt))
      .filter(
        (d) =>
          d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth(),
      )
      .map((d) => d.getDate()),
  );

  const isToday = (n: number) =>
    today.getFullYear() === cursor.getFullYear() &&
    today.getMonth() === cursor.getMonth() &&
    today.getDate() === n;

  const dayAppointments = (n: number | null) =>
    n === null
      ? []
      : appointments.filter((a) => {
          const d = new Date(a.startsAt);
          return (
            d.getFullYear() === cursor.getFullYear() &&
            d.getMonth() === cursor.getMonth() &&
            d.getDate() === n
          );
        });

  const selectedAppts = dayAppointments(selected);

  return (
    <Card className="border-border/60 bg-card/60 shadow-elegant backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Calendar</CardTitle>
            <p className="text-xs text-muted-foreground">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((n, i) => (
            <button
              type="button"
              key={i}
              disabled={n === null}
              onClick={() => n !== null && setSelected(n)}
              className={cn(
                "relative grid aspect-square place-items-center rounded-md text-xs transition-colors",
                n === null
                  ? "text-muted-foreground/40 cursor-default"
                  : isToday(n)
                    ? "bg-gradient-primary font-semibold text-primary-foreground shadow-glow"
                    : selected === n
                      ? "bg-accent text-foreground ring-1 ring-primary/40"
                      : "text-foreground/80 hover:bg-accent/50",
              )}
            >
              {n ?? ""}
              {n !== null && apptDays.has(n) && !isToday(n) && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        {selected !== null && (
          <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {new Date(cursor.getFullYear(), cursor.getMonth(), selected).toLocaleDateString(
                undefined,
                { weekday: "long", month: "short", day: "numeric" },
              )}
            </div>
            {selectedAppts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No appointments scheduled.</p>
            ) : (
              selectedAppts
                .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
                .map((a) => {
                  const p = getPatient(a.patientId);
                  const s = getPractitioner(a.specialistId);
                  return (
                    <Link
                      key={a.id}
                      to="/appointments"
                      className="block rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5 text-xs hover:bg-accent/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {new Date(a.startsAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {p?.name} · {s?.name}
                        </span>
                      </div>
                    </Link>
                  );
                })
            )}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Appointment
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" />
            {apptDays.size} this month
          </span>
          <AlertTriangle className="ml-auto h-3 w-3 opacity-0" />
        </div>
      </CardContent>
    </Card>
  );
}