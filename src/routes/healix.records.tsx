import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { patientsQuery } from "@/lib/healix/queries";
import { getFhirClient } from "@/lib/healix/fhir";
import { queryOptions } from "@tanstack/react-query";

const allReportsQuery = () =>
  queryOptions({
    queryKey: ["healix", "all-reports"],
    queryFn: async () => {
      const patients = await getFhirClient().listPatients();
      const reports = await Promise.all(
        patients.map(async (p) => {
          const r = await getFhirClient().listDiagnosticReports(p.id);
          return r.map((rep) => ({ ...rep, patientName: p.fullName, patientId: p.id }));
        }),
      );
      return reports.flat();
    },
  });

export const Route = createFileRoute("/healix/records")({
  head: () => ({
    meta: [
      { title: "Medical records — HEALIX AI" },
      { name: "description", content: "Diagnostic reports, imaging and clinical notes across all patients." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(patientsQuery());
    context.queryClient.ensureQueryData(allReportsQuery());
  },
  component: RecordsPage,
});

function RecordsPage() {
  const { data: reports } = useSuspenseQuery(allReportsQuery());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const cats = useMemo(() => Array.from(new Set(reports.map((r) => r.category?.[0]?.text ?? "Other"))), [reports]);
  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (cat !== "all" && (r.category?.[0]?.text ?? "Other") !== cat) return false;
      if (q && !((r.code.text ?? "") + " " + r.patientName + " " + (r.conclusion ?? "")).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [reports, cat, q]);

  return (
    <HealixShell title="Medical records" subtitle={`${filtered.length} records`}>
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports, patients, findings…" className="pl-9" />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(["all", ...cats] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  "text-xs rounded-full px-3 py-1.5 border whitespace-nowrap transition-colors " +
                  (cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {filtered.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent grid place-items-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold truncate">{r.code.text}</div>
                  <Badge variant="secondary" className="text-[10px]">{r.category?.[0]?.text}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {r.patientName} · {new Date(r.effectiveDateTime).toLocaleDateString()}
                </div>
                <div className="text-xs mt-2 text-muted-foreground">{r.conclusion}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </HealixShell>
  );
}