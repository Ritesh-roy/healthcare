import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarPlus, Clock } from "lucide-react";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { appointmentsQuery, patientsQuery, practitionersQuery, healixKeys } from "@/lib/healix/queries";
import { getFhirClient } from "@/lib/healix/fhir";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/healix/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — HEALIX AI" },
      { name: "description", content: "Schedule, reschedule and triage appointments across your clinic." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(appointmentsQuery());
    context.queryClient.ensureQueryData(patientsQuery());
    context.queryClient.ensureQueryData(practitionersQuery());
  },
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const qc = useQueryClient();
  const { data: appts } = useSuspenseQuery(appointmentsQuery());
  const { data: patients } = useSuspenseQuery(patientsQuery());
  const { data: practitioners } = useSuspenseQuery(practitionersQuery());

  const grouped = useMemo(() => {
    const map = new Map<string, typeof appts>();
    for (const a of appts) {
      const key = a.start.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [appts]);

  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    patientId: patients[0]?.id ?? "",
    practitionerId: practitioners[0]?.id ?? "",
    date: today,
    time: "09:00",
    duration: 30,
    reason: "",
  });

  const onCreate = async () => {
    if (!form.patientId) {
      toast.error("Patient is required");
      return;
    }
    if (!form.practitionerId) {
      toast.error("Practitioner is required");
      return;
    }
    if (!form.date) {
      toast.error("Date is required");
      return;
    }
    if (!form.time) {
      toast.error("Time is required");
      return;
    }
    if (!form.duration) {
      toast.error("Duration is required");
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    if (form.date < today) {
      toast.error("Cannot book on a past date");
      return;
    }
    const start = new Date(`${form.date}T${form.time}:00`);
    const end = new Date(start.getTime() + form.duration * 60_000);
    await getFhirClient().createAppointment({
      status: "booked",
      start: start.toISOString(),
      end: end.toISOString(),
      minutesDuration: form.duration,
      description: form.reason || "Follow-up",
      participant: [
        { actor: { reference: `Patient/${form.patientId}` }, status: "accepted" },
        { actor: { reference: `Practitioner/${form.practitionerId}` }, status: "accepted" },
      ],
    });
    await qc.invalidateQueries({ queryKey: healixKeys.appointments() });
    toast.success("Appointment booked");
    setOpen(false);
  };

  return (
    <HealixShell
      title="Appointments"
      subtitle={`${appts.length} scheduled across ${grouped.length} days`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
              <CalendarPlus className="h-4 w-4" /> <span className="hidden sm:inline">New booking</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New appointment</DialogTitle>
              <DialogDescription>Book a new patient consultation. Past dates are disabled.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Patient <span aria-hidden="true" className="text-destructive ml-0.5">*</span></Label>
                <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName} · {p.mrn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Practitioner <span aria-hidden="true" className="text-destructive ml-0.5">*</span></Label>
                <Select value={form.practitionerId} onValueChange={(v) => setForm({ ...form, practitionerId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {practitioners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name[0].prefix?.join(" ")} {p.name[0].given.join(" ")} {p.name[0].family} · {p.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date <span aria-hidden="true" className="text-destructive ml-0.5">*</span></Label>
                  <Input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>Time <span aria-hidden="true" className="text-destructive ml-0.5">*</span></Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Reason <span aria-hidden="true" className="text-destructive ml-0.5">*</span></Label>
                <Input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Diabetes follow-up" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onCreate} className="bg-gradient-primary text-primary-foreground">Book</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-5">
        {grouped.map(([date, list]) => {
          const d = new Date(date);
          const isToday = date === today;
          return (
            <Card key={date}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
                  {isToday && <span className="text-[10px] font-medium uppercase rounded-full bg-primary/15 text-primary px-2 py-0.5">Today</span>}
                </CardTitle>
                <span className="text-xs text-muted-foreground">{list.length} appointments</span>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {list
                  .sort((a, b) => a.start.localeCompare(b.start))
                  .map((a) => {
                    const pid = a.participant.find((p) => p.actor.reference.startsWith("Patient/"))?.actor.reference.split("/")[1];
                    const prid = a.participant.find((p) => p.actor.reference.startsWith("Practitioner/"))?.actor.reference.split("/")[1];
                    const patient = patients.find((x) => x.id === pid);
                    const pract = practitioners.find((x) => x.id === prid);
                    return (
                      <div key={a.id} className="py-3 flex items-center gap-3">
                        <div className="w-14 text-sm font-medium tabular-nums">
                          {new Date(a.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{patient?.fullName ?? "Patient"}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {a.description} · {pract ? `Dr. ${pract.name[0].family} · ${pract.specialty}` : ""}
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 font-medium",
                          a.status === "arrived"
                            ? "bg-[var(--status-success-bg)] text-[oklch(var(--status-success))]"
                            : a.status === "cancelled"
                              ? "bg-[var(--status-danger-bg)] text-[oklch(var(--status-danger))]"
                              : "bg-[var(--status-info-bg)] text-[oklch(var(--status-info))]",
                        )}>
                          {a.status}
                        </span>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </HealixShell>
  );
}