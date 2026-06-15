import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { patientsQuery } from "@/lib/healix/queries";
import { RiskPill } from "./healix.index";

export const Route = createFileRoute("/healix/patients/")({
  head: () => ({
    meta: [
      { title: "Patients — HEALIX AI" },
      { name: "description", content: "Active patient directory with FHIR-backed clinical context." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery()),
  component: PatientsPage,
});

function PatientsPage() {
  const { data: patients } = useSuspenseQuery(patientsQuery());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "high" | "follow">("all");

  const list = useMemo(() => {
    let l = patients;
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((p) => (p.fullName + " " + p.mrn + " " + (p.city ?? "")).toLowerCase().includes(s));
    }
    if (filter === "high") l = l.filter((p) => p.riskScore >= 70);
    if (filter === "follow") l = l.filter((p) => p.activeConditions > 0);
    return l;
  }, [patients, q, filter]);

  return (
    <HealixShell
      title="Patients"
      subtitle={`${list.length} of ${patients.length} patients`}
      actions={
        <Button className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
          <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">New patient</span>
        </Button>
      }
    >
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, MRN, city…" className="pl-9 h-9" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
            {(
              [
                ["all", "All"],
                ["high", "High risk"],
                ["follow", "Active care"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={
                  "text-xs rounded-full px-3 py-1.5 border whitespace-nowrap transition-colors " +
                  (filter === k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mt-4">
        {list.map((p) => (
          <Link
            key={p.id}
            to="/healix/patients/$id"
            params={{ id: p.id }}
            className="group rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-elegant transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-primary grid place-items-center text-sm font-semibold text-primary-foreground shrink-0">
                {p.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold truncate">{p.fullName}</div>
                  <RiskPill score={p.riskScore} />
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {p.mrn} · {p.age}y · {p.gender} · {p.bloodType ?? "—"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {p.city ?? "—"} · {p.phone}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">
                {p.activeConditions} conditions
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {p.activeMedications} meds
              </Badge>
              {p.codeStatus && p.codeStatus !== "Full Code" && (
                <Badge variant="outline" className="text-[10px] border-[oklch(var(--status-danger))]/40 text-[oklch(var(--status-danger))]">
                  {p.codeStatus}
                </Badge>
              )}
            </div>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-12">
            No patients match your filters.
          </div>
        )}
      </div>
    </HealixShell>
  );
}