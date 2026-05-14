import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { appointments, getPatient, getPractitioner } from "@/lib/mock-data";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "Appointments — Refera" }] }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  // Build a 14-day calendar starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 2);
    return d;
  });

  const byDay = (d: Date) =>
    appointments
      .filter((a) => {
        const ad = new Date(a.startsAt);
        return ad.toDateString() === d.toDateString();
      })
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
            <p className="text-sm text-muted-foreground mt-1">Two-week schedule across all specialists.</p>
          </div>
          <Link to="/appointments/new">
            <Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow">
              <CalendarPlus className="h-4 w-4" /> Book appointment
            </Button>
          </Link>
        </div>

        <Card className="glass-panel border-border/60">
          <CardHeader>
            <CardTitle className="text-base">
              {today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {days.map((d) => {
                const items = byDay(d);
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={d.toISOString()}
                    className={`rounded-lg border bg-card/40 p-2.5 min-h-[140px] ${
                      isToday ? "border-primary/60 shadow-glow" : "border-border"
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {d.toLocaleDateString(undefined, { weekday: "short" })}
                      </div>
                      <div className={`text-sm font-semibold tabular-nums ${isToday ? "text-primary" : ""}`}>
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((a) => {
                        const p = getPatient(a.patientId)!;
                        const sp = getPractitioner(a.specialistId)!;
                        return (
                          <Link
                            key={a.id}
                            to="/referrals/$id"
                            params={{ id: a.referralId }}
                            className="block rounded-md bg-primary/15 hover:bg-primary/25 border border-primary/25 px-2 py-1.5 transition-colors"
                          >
                            <div className="text-[11px] font-semibold tabular-nums text-primary">
                              {new Date(a.startsAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="text-xs font-medium truncate">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{sp.specialty}</div>
                          </Link>
                        );
                      })}
                    </div>
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