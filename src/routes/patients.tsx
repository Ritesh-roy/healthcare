import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { patients, referrals } from "@/lib/mock-data";

export const Route = createFileRoute("/patients")({
  head: () => ({ meta: [{ title: "Patients — Refera" }] }),
  component: PatientsPage,
});

function PatientsPage() {
  return (
    <AppShell>
      <div className="px-6 py-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">Active patient panel across your practice.</p>
        </div>

        <Card className="glass-panel border-border/60">
          <CardContent className="p-0">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <div className="col-span-4">Patient</div>
              <div className="col-span-2">DOB</div>
              <div className="col-span-3">Active problems</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-1 text-right">Referrals</div>
            </div>
            <div className="divide-y divide-border">
              {patients.map((p) => {
                const count = referrals.filter((r) => r.patientId === p.id).length;
                return (
                  <div key={p.id} className="grid grid-cols-12 items-center px-5 py-3.5 text-sm hover:bg-accent/40 transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-xs font-semibold">
                        {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.mrn} · {p.sex}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-muted-foreground tabular-nums">{p.dob}</div>
                    <div className="col-span-3 text-muted-foreground truncate">{p.problems.join(", ")}</div>
                    <div className="col-span-2 text-muted-foreground tabular-nums">{p.phone}</div>
                    <div className="col-span-1 text-right font-medium">{count}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}