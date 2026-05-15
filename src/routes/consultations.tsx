import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { getPatient, getPractitioner, getReferral } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { scopedConsultations } from "@/lib/scoped";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/consultations")({
  head: () => ({ meta: [{ title: "Consultations — Refera" }] }),
  component: ConsultsPage,
});

function ConsultsPage() {
  const { user } = useAuth();
  const consultations = scopedConsultations(user);
  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1100px] mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consultations</h1>
          <p className="text-sm text-muted-foreground mt-1">Outcome notes returned by specialists.</p>
        </div>

        <div className="space-y-3">
          {consultations.map((c) => {
            const p = getPatient(c.patientId)!;
            const sp = getPractitioner(c.specialistId)!;
            const r = getReferral(c.referralId)!;
            return (
              <Card key={c.id} className="glass-panel border-border/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <Link to="/referrals/$id" params={{ id: r.id }} className="text-sm font-medium hover:underline">
                          {p.name} · {r.specialty}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {sp.name} · {new Date(c.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <Field label="Summary">{c.summary}</Field>
                    <Field label="Recommendations">{c.recommendations}</Field>
                    <Field label="Follow-up">{c.followUp}</Field>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="mt-1 leading-relaxed">{children}</div>
    </div>
  );
}