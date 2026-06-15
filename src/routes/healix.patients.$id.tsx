import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  Phone,
  Pill,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  allergiesQuery,
  conditionsQuery,
  encountersQuery,
  labsQuery,
  medsQuery,
  patientQuery,
  reportsQuery,
  vitalsQuery,
} from "@/lib/healix/queries";
import { cn } from "@/lib/utils";
import { RiskPill } from "./healix.index";

export const Route = createFileRoute("/healix/patients/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(patientQuery(params.id));
    if (!p) throw notFound();
    context.queryClient.ensureQueryData(vitalsQuery(params.id));
    context.queryClient.ensureQueryData(labsQuery(params.id));
    context.queryClient.ensureQueryData(conditionsQuery(params.id));
    context.queryClient.ensureQueryData(medsQuery(params.id));
    context.queryClient.ensureQueryData(allergiesQuery(params.id));
    context.queryClient.ensureQueryData(encountersQuery(params.id));
    context.queryClient.ensureQueryData(reportsQuery(params.id));
  },
  notFoundComponent: () => (
    <HealixShell title="Patient not found">
      <div className="text-sm text-muted-foreground">
        We couldn't find this patient.{" "}
        <Link to="/healix/patients" className="text-primary">Back to directory</Link>
      </div>
    </HealixShell>
  ),
  component: PatientProfile,
});

function PatientProfile() {
  const { id } = Route.useParams();
  const { data: p } = useSuspenseQuery(patientQuery(id));
  const { data: vitals } = useSuspenseQuery(vitalsQuery(id));
  const { data: labs } = useSuspenseQuery(labsQuery(id));
  const { data: conditions } = useSuspenseQuery(conditionsQuery(id));
  const { data: meds } = useSuspenseQuery(medsQuery(id));
  const { data: allergies } = useSuspenseQuery(allergiesQuery(id));
  const { data: encounters } = useSuspenseQuery(encountersQuery(id));
  const { data: reports } = useSuspenseQuery(reportsQuery(id));

  if (!p) return null;

  const name = p.name[0];
  const fullName = `${name.given.join(" ")} ${name.family}`;
  const age = (() => {
    const b = new Date(p.birthDate);
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
    return a;
  })();

  const hrSeries = vitals
    .filter((v) => v.code.text === "Heart rate")
    .map((v) => ({ d: v.effectiveDateTime.slice(5, 10), value: v.valueQuantity?.value ?? 0 }));
  const sbpSeries = vitals
    .filter((v) => v.code.text === "Systolic BP")
    .map((v) => ({ d: v.effectiveDateTime.slice(5, 10), value: v.valueQuantity?.value ?? 0 }));
  const spo2Series = vitals
    .filter((v) => v.code.text === "SpO2")
    .map((v) => ({ d: v.effectiveDateTime.slice(5, 10), value: v.valueQuantity?.value ?? 0 }));

  const latest = (series: { value: number }[]) => (series.length ? series[series.length - 1].value : 0);
  const riskScore = Math.min(100, conditions.length * 15 + meds.length * 6 + allergies.length * 5);

  return (
    <HealixShell
      title={fullName}
      subtitle={`${p.identifier?.[0]?.value} · ${age}y · ${p.gender} · ${p.bloodType ?? "—"}`}
      actions={
        <Button className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
          <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">AI summary</span>
        </Button>
      }
    >
      <Link to="/healix/patients" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-3">
        <ArrowLeft className="h-3 w-3" /> All patients
      </Link>

      <Card className="bg-gradient-surface border-border/60">
        <CardContent className="p-5 flex flex-col md:flex-row gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary grid place-items-center text-lg font-semibold text-primary-foreground shrink-0 shadow-glow">
              {fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold tracking-tight">{fullName}</div>
              <div className="text-xs text-muted-foreground">
                {age}y · {p.gender} · Blood {p.bloodType} · {p.address?.[0]?.city ?? "—"}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <RiskPill score={riskScore} />
                <Badge variant="outline" className="text-[10px]">
                  {p.codeStatus}
                </Badge>
                {allergies.length > 0 && (
                  <Badge variant="outline" className="text-[10px] border-[oklch(var(--status-danger))]/40 text-[oklch(var(--status-danger))]">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {allergies.length} allergies
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <VitalChip label="Heart rate" value={`${latest(hrSeries).toFixed(0)} bpm`} />
            <VitalChip label="Systolic BP" value={`${latest(sbpSeries).toFixed(0)} mmHg`} />
            <VitalChip label="SpO₂" value={`${latest(spo2Series).toFixed(0)}%`} />
            <VitalChip label="Last visit" value={encounters[0] ? new Date(encounters[0].period.start ?? "").toLocaleDateString() : "—"} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="mt-5">
        <TabsList className="overflow-x-auto justify-start w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="meds">Medications</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="labs">Labs & Reports</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary" /> Vitals — last 30 days
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hrSeries}>
                  <defs>
                    <linearGradient id="vit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" stroke="oklch(0.66 0.025 230)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.66 0.025 230)" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.02 235)", border: "1px solid oklch(0.32 0.02 230 / 45%)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.68 0.22 22)" fill="url(#vit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {p.telecom?.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground capitalize">{t.system}</span>
                  <span className="truncate">{t.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">City</span>
                <span>{p.address?.[0]?.city ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Primary care</span>
                <span>Dr. {p.primaryCare}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <VitalsChart title="Heart rate" data={hrSeries} unit="bpm" color="oklch(0.68 0.22 22)" />
          <VitalsChart title="Systolic BP" data={sbpSeries} unit="mmHg" color="oklch(0.78 0.16 215)" />
          <VitalsChart title="SpO₂" data={spo2Series} unit="%" color="oklch(0.72 0.18 175)" />
        </TabsContent>

        <TabsContent value="meds" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" /> Active medications
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {meds.map((m) => (
                <div key={m.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{m.medicationCodeableConcept.text}</div>
                    <div className="text-xs text-muted-foreground">{m.dosageInstruction?.[0]?.text}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {m.status}
                  </Badge>
                </div>
              ))}
              {meds.length === 0 && <div className="text-sm text-muted-foreground py-2">No active medications.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {conditions.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="text-sm font-medium">{c.code.text}</div>
                  <span className="text-[10px] text-muted-foreground">{c.recordedDate ? new Date(c.recordedDate).toLocaleDateString() : ""}</span>
                </div>
              ))}
              {conditions.length === 0 && <div className="text-sm text-muted-foreground py-2">No active conditions.</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[oklch(var(--status-danger))]" /> Allergies
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {allergies.map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="text-sm font-medium">{a.code.text}</div>
                  <Badge variant="outline" className="text-[10px] border-[oklch(var(--status-danger))]/40 text-[oklch(var(--status-danger))]">
                    {a.criticality}
                  </Badge>
                </div>
              ))}
              {allergies.length === 0 && <div className="text-sm text-muted-foreground py-2">No known allergies.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent labs</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {labs.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{l.code.text}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(l.effectiveDateTime).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm tabular-nums">
                    {l.valueQuantity?.value.toFixed(1)} <span className="text-muted-foreground">{l.valueQuantity?.unit}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Diagnostic reports
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {reports.map((r) => (
                <div key={r.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{r.code.text}</div>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.effectiveDateTime).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{r.conclusion}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Encounters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-border pl-5 space-y-5">
                {encounters.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-primary shadow-glow" />
                    <div className="text-sm font-medium">{e.reasonCode?.[0]?.text ?? "Encounter"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {e.class.display} · {new Date(e.period.start ?? "").toLocaleString()}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </HealixShell>
  );
}

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 px-3 py-2 bg-card">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

function VitalsChart({
  title,
  data,
  unit,
  color,
}: {
  title: string;
  data: { d: string; value: number }[];
  unit: string;
  color: string;
}) {
  const last = data[data.length - 1]?.value ?? 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{title}</span>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {last.toFixed(1)} {unit}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("h-[180px]")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="d" stroke="oklch(0.66 0.025 230)" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.66 0.025 230)" fontSize={9} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "oklch(0.18 0.02 235)", border: "1px solid oklch(0.32 0.02 230 / 45%)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}