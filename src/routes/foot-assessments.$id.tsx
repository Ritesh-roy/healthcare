import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Footprints } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchFootAssessment, riskTone, circulationTone } from "@/lib/foot-assessments";
import { useRealtimeTables } from "@/lib/realtime";

export const Route = createFileRoute("/foot-assessments/$id")({
  head: () => ({ meta: [{ title: "Foot Assessment Report — Refera" }] }),
  component: FootAssessmentDetail,
  errorComponent: ({ error }) => <AppShell><div className="p-6 text-sm text-[oklch(var(--status-danger))]">{error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="p-6 text-sm">Assessment not found.</div></AppShell>,
});

function FootAssessmentDetail() {
  const { id } = useParams({ from: "/foot-assessments/$id" });
  const navigate = useNavigate();
  useRealtimeTables(["foot_assessments"], [["foot_assessment", id]]);
  const { data: row, isLoading } = useQuery({
    queryKey: ["foot_assessment", id],
    queryFn: () => fetchFootAssessment(id),
  });

  if (isLoading) return <AppShell><div className="p-6 text-sm text-muted-foreground">Loading…</div></AppShell>;
  if (!row) return <AppShell><div className="p-6 text-sm">Assessment not found.</div></AppShell>;

  const d = new Date(row.assessment_date);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[900px] mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/foot-assessments" })} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>

        <Card className="glass-panel border-border/60 print:border-black print:shadow-none">
          <CardContent className="p-6 space-y-5 print:text-black">
            <header className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Medical Report</div>
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 mt-1">
                  <Footprints className="h-5 w-5 text-primary print:hidden" />
                  Foot & Toe Pressure Assessment
                </h1>
                <div className="text-xs text-muted-foreground mt-1">Report ID: {row.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={riskTone(row.risk_level)}>{row.risk_level} risk</Badge>
                <div className="text-xs text-muted-foreground mt-2">{d.toLocaleDateString(undefined, { dateStyle: "long" })}</div>
                <div className="text-xs text-muted-foreground">{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </header>

            <Section title="Patient Details">
              <Grid items={[
                ["Name", row.patient_name],
                ["Age", row.patient_age ?? "—"],
                ["Gender", row.patient_gender ?? "—"],
                ["Mobile", row.patient_phone ?? "—"],
                ["Patient ID", row.patient_id.slice(0, 8).toUpperCase()],
              ]} />
            </Section>

            <Section title="Medical History">
              <Grid items={[
                ["Diabetes", yesNo(row.diabetes)],
                ["High BP", yesNo(row.hypertension)],
                ["Smoking", yesNo(row.smoking)],
                ["Prior foot surgery", yesNo(row.previous_foot_surgery)],
              ]} />
            </Section>

            <Section title="Symptoms">
              <div className="text-sm">{row.symptoms.length ? row.symptoms.join(", ") : "None reported"}</div>
            </Section>

            <Section title="Pressure Measurements">
              <Grid items={[
                ["Left toe", `${row.left_toe_pressure ?? "—"} mmHg`],
                ["Right toe", `${row.right_toe_pressure ?? "—"} mmHg`],
                ["Left foot", `${row.left_foot_pressure ?? "—"} mmHg`],
                ["Right foot", `${row.right_foot_pressure ?? "—"} mmHg`],
              ]} />
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Blood circulation: </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${circulationTone(row.circulation_status)}`}>{row.circulation_status}</span>
              </div>
            </Section>

            <Section title="Clinical Findings">
              <Field label="Observations">{row.observations || "—"}</Field>
              <Field label="Diagnosis">{row.diagnosis_notes || "—"}</Field>
            </Section>

            <Section title="Doctor Remarks">
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{row.doctor_remarks || "—"}</div>
            </Section>

            <Section title="Recommendations">
              <ul className="list-disc pl-5 text-sm space-y-1">
                {row.recommendations.length ? row.recommendations.map((r) => <li key={r}>{r}</li>) : <li>None</li>}
              </ul>
            </Section>

            <footer className="pt-6 mt-2 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Reported by</div>
                <div className="text-sm font-medium mt-1">{row.doctor_name ?? "—"}</div>
                <div className="mt-10 border-t border-border pt-1 text-xs text-muted-foreground">Signature</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Date & time</div>
                <div className="text-sm mt-1">{d.toLocaleString()}</div>
              </div>
            </footer>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      {items.map(([label, value]) => (
        <div key={label}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-medium mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5 whitespace-pre-wrap leading-relaxed">{children}</div>
    </div>
  );
}
function yesNo(v: boolean) { return v ? "Yes" : "No"; }