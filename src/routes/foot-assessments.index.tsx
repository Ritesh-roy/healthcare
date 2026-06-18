import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Printer, Footprints, Activity, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchPatients } from "@/lib/app-data";
import { fetchFootAssessments, riskTone, circulationTone, type FootAssessmentRow } from "@/lib/foot-assessments";
import { useRealtimeTables } from "@/lib/realtime";
import { toast } from "sonner";

export const Route = createFileRoute("/foot-assessments/")({
  head: () => ({ meta: [{ title: "Foot & Toe Pressure Assessment — Refera" }] }),
  component: FootAssessmentsPage,
});

function FootAssessmentsPage() {
  useRealtimeTables(["foot_assessments", "patients"], [["foot_assessments"], ["patients"]]);
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ["foot_assessments"], queryFn: fetchFootAssessments });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<string>("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (risk !== "all" && r.risk_level !== risk) return false;
      if (!term) return true;
      return `${r.patient_name} ${r.patient_phone ?? ""} ${r.circulation_status}`.toLowerCase().includes(term);
    });
  }, [rows, q, risk]);

  const stats = useMemo(() => {
    const total = rows.length;
    const high = rows.filter((r) => r.risk_level === "High").length;
    const avgLeft = avg(rows.map((r) => r.left_toe_pressure));
    const avgRight = avg(rows.map((r) => r.right_toe_pressure));
    return { total, high, avgLeft, avgRight };
  }, [rows]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    const { error } = await supabase.from("foot_assessments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Assessment deleted");
    qc.invalidateQueries({ queryKey: ["foot_assessments"] });
  };

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Footprints className="h-6 w-6 text-primary" /> Foot & Toe Pressure Assessment
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Diabetic foot circulation, toe pressure, and nerve sensitivity screening.</p>
          </div>
          <Link to="/foot-assessments/new">
            <Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow">
              <Plus className="h-4 w-4" /> New assessment
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total assessments" value={stats.total} icon={<Activity className="h-4 w-4" />} />
          <StatCard label="High-risk patients" value={stats.high} icon={<AlertTriangle className="h-4 w-4 text-[oklch(var(--status-danger))]" />} />
          <StatCard label="Avg. left toe (mmHg)" value={stats.avgLeft ?? "—"} icon={<Footprints className="h-4 w-4" />} />
          <StatCard label="Avg. right toe (mmHg)" value={stats.avgRight ?? "—"} icon={<Footprints className="h-4 w-4" />} />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by patient, phone, status…" className="pl-9 h-9 bg-input/60" />
          </div>
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All risk levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <AssessmentCard key={r.id} row={r} onDelete={() => onDelete(r.id)} hasPatient={patients.some((p) => p.id === r.patient_id)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">No assessments match your filters.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card className="glass-panel border-border/60">
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function AssessmentCard({ row, onDelete, hasPatient }: { row: FootAssessmentRow; onDelete: () => void; hasPatient: boolean }) {
  const date = new Date(row.assessment_date);
  return (
    <Card className="glass-panel border-border/60 hover:border-primary/40 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{row.patient_name}</div>
            <div className="text-xs text-muted-foreground">
              {row.patient_age ? `${row.patient_age} yr · ` : ""}{row.patient_gender ?? "—"}
              {row.patient_phone ? ` · ${row.patient_phone}` : ""}
            </div>
          </div>
          <Badge variant="outline" className={riskTone(row.risk_level)}>{row.risk_level} risk</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <PressureCell label="Left toe" value={row.left_toe_pressure} />
          <PressureCell label="Right toe" value={row.right_toe_pressure} />
          <PressureCell label="Left foot" value={row.left_foot_pressure} />
          <PressureCell label="Right foot" value={row.right_foot_pressure} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-0.5 rounded-full ${circulationTone(row.circulation_status)}`}>{row.circulation_status}</span>
          <span className="text-muted-foreground">{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="flex gap-2 pt-1 border-t border-border/60">
          <Link to="/foot-assessments/$id" params={{ id: row.id }} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1"><Printer className="h-3.5 w-3.5" /> View & print</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={onDelete} className="gap-1 text-[oklch(var(--status-danger))]">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {!hasPatient && <div className="text-[10px] text-muted-foreground italic">Patient record removed</div>}
      </CardContent>
    </Card>
  );
}

function PressureCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md bg-accent/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value ?? "—"} <span className="text-[10px] font-normal text-muted-foreground">mmHg</span></div>
    </div>
  );
}

function avg(values: (number | null)[]): string | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(0);
}