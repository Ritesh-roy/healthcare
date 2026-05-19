import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Search, Phone, MapPin, BedDouble, AlertTriangle, CalendarPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chestHospitals } from "@/lib/chest-data";
import { getPractitioner } from "@/lib/mock-data";
import { allAppointments } from "@/lib/scoped";

export const Route = createFileRoute("/hospitals")({
  head: () => ({ meta: [{ title: "Chest Hospitals — Refera" }] }),
  component: HospitalsPage,
});

function HospitalsPage() {
  const [q, setQ] = useState("");
  const [onlyEmergency, setOnlyEmergency] = useState(false);

  const rows = useMemo(() => {
    return chestHospitals.filter((h) => {
      if (onlyEmergency && !h.emergency) return false;
      if (!q.trim()) return true;
      const hay = `${h.name} ${h.city} ${h.departments.join(" ")}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [q, onlyEmergency]);

  const now = Date.now();
  const busyIds = new Set(
    allAppointments()
      .filter((a) => {
        const start = +new Date(a.startsAt);
        return start <= now && start + a.durationMin * 60_000 >= now;
      })
      .map((a) => a.specialistId),
  );

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Chest hospitals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All chest / pulmonology centres with live specialist availability.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by hospital, city, department…"
              className="pl-9 h-9 bg-input/60"
            />
          </div>
          <Button
            variant={onlyEmergency ? "default" : "outline"}
            onClick={() => setOnlyEmergency((v) => !v)}
            className="gap-1.5 h-9"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> 24×7 Emergency only
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((h) => {
            const free = h.specialistIds.filter((id) => !busyIds.has(id)).length;
            return (
              <Card key={h.id} className="glass-panel border-border/60 overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-semibold truncate">{h.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {h.city}
                      </div>
                    </div>
                    {h.emergency && (
                      <Badge variant="outline" className="border-[oklch(var(--status-danger))]/60 text-[oklch(var(--status-danger))]">
                        Emergency
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="Beds" value={h.beds.toString()} icon={<BedDouble className="h-3 w-3" />} />
                    <Stat label="Doctors" value={`${h.specialistIds.length}`} />
                    <Stat label="Available" value={`${free}/${h.specialistIds.length}`} tone={free > 0 ? "success" : "warn"} />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {h.departments.map((d) => (
                      <Badge key={d} variant="secondary" className="text-[10px]">
                        {d}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Specialists</div>
                    {h.specialistIds.map((id) => {
                      const sp = getPractitioner(id);
                      if (!sp) return null;
                      const busy = busyIds.has(id);
                      return (
                        <div key={id} className="flex items-center justify-between text-sm">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{sp.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{sp.specialty}</div>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] ${busy ? "text-[oklch(var(--status-warn))]" : "text-[oklch(var(--status-success))]"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${busy ? "bg-[oklch(var(--status-warn))]" : "bg-[oklch(var(--status-success))] animate-pulse"}`} />
                            {busy ? "In consult" : "Live"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {h.phone}
                    </div>
                    <div className="text-xs">
                      Fee <span className="font-semibold text-foreground">₹{h.consultationFee}</span>
                    </div>
                  </div>

                  <Link to="/appointments/new">
                    <Button className="w-full gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow">
                      <CalendarPlus className="h-4 w-4" /> Refer & book
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
          {rows.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-12">
              No hospitals match your filters.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "success" | "warn"; icon?: React.ReactNode }) {
  const color =
    tone === "success"
      ? "text-[oklch(var(--status-success))]"
      : tone === "warn"
        ? "text-[oklch(var(--status-warn))]"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-card/40 px-2 py-1.5">
      <div className={`text-sm font-semibold tabular-nums ${color} flex items-center justify-center gap-1`}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}