import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarPlus, ArrowLeft, Download, Check, Printer } from "lucide-react";
import jsPDF from "jspdf";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patients, practitioners, referrals, getPatient, getPractitioner } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments/new")({
  head: () => ({ meta: [{ title: "Book appointment — Refera" }] }),
  component: NewAppointmentPage,
});

function NewAppointmentPage() {
  const navigate = useNavigate();
  const specialists = practitioners.filter((p) => p.role === "Specialist");
  const today = new Date().toISOString().slice(0, 10);

  const [patientId, setPatientId] = useState<string>("");
  const [specialistId, setSpecialistId] = useState<string>("");
  const [referralId, setReferralId] = useState<string>("");
  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<string>("30");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [confirmed, setConfirmed] = useState<null | {
    id: string;
    bookedAt: string;
  }>(null);

  const patient = useMemo(() => (patientId ? getPatient(patientId) : null), [patientId]);
  const specialist = useMemo(
    () => (specialistId ? getPractitioner(specialistId) : null),
    [specialistId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !specialistId || !date || !time) {
      toast.error("Please complete patient, specialist, date and time.");
      return;
    }
    const id = `APT-${Date.now().toString(36).toUpperCase()}`;
    setConfirmed({ id, bookedAt: new Date().toISOString() });
    toast.success("Appointment booked", {
      description: `${date} at ${time} · ${location || "Location TBC"}`,
    });
  };

  const downloadPdf = () => {
    if (!confirmed || !patient || !specialist) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const startsAt = new Date(`${date}T${time}`);
    let y = 56;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Refera — Appointment Confirmation", 56, y);
    y += 10;
    doc.setDrawColor(200);
    doc.line(56, y, 540, y);
    y += 26;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Reference ${confirmed.id}  ·  Booked ${new Date(confirmed.bookedAt).toLocaleString()}`, 56, y);
    y += 30;
    doc.setTextColor(20);

    const rows: [string, string][] = [
      ["Patient", `${patient.name}  ·  MRN ${patient.mrn}`],
      ["DOB / Phone", `${patient.dob}  ·  ${patient.phone}`],
      ["Specialist", `${specialist.name}  ·  ${specialist.specialty ?? "—"}`],
      ["Organisation", specialist.organization],
      ["Date & time", startsAt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })],
      ["Duration", `${duration} minutes`],
      ["Location", location || "To be confirmed"],
      ["Linked referral", referralId || "—"],
      ["Notes", notes || "—"],
    ];
    doc.setFontSize(11);
    rows.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(k, 56, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(v, 360);
      doc.text(lines, 180, y);
      y += 18 * Math.max(1, lines.length);
    });
    y += 20;
    doc.setDrawColor(220);
    doc.line(56, y, 540, y);
    y += 22;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("This is a system-generated confirmation. Please arrive 10 minutes prior.", 56, y);
    doc.save(`refera-appointment-${confirmed.id}.pdf`);
    toast.success("PDF downloaded");
  };

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/appointments">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Book appointment</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule a new specialist visit for a patient.
            </p>
          </div>
        </div>

        {confirmed && patient && specialist && (
          <Card className="glass-panel border-primary/40 shadow-glow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Appointment confirmed · {confirmed.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Row k="Patient" v={`${patient.name} · MRN ${patient.mrn}`} />
                <Row k="Specialist" v={`${specialist.name} · ${specialist.specialty ?? "—"}`} />
                <Row
                  k="When"
                  v={new Date(`${date}T${time}`).toLocaleString(undefined, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                />
                <Row k="Duration" v={`${duration} minutes`} />
                <Row k="Location" v={location || "TBC"} />
                <Row k="Linked referral" v={referralId || "—"} />
              </dl>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={downloadPdf} className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow">
                  <Download className="h-4 w-4" /> Save record as PDF
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button variant="ghost" onClick={() => navigate({ to: "/appointments" })}>
                  Back to calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-panel border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-primary" /> Appointment details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Patient</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {p.mrn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Specialist</Label>
                <Select value={specialistId} onValueChange={setSpecialistId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialist" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialists.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["15", "30", "45", "60", "90"].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Linked referral (optional)</Label>
                <Select value={referralId} onValueChange={setReferralId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {referrals.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.id} · {r.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. St. Aldwyn · Clinic A"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the specialist should know"
                  rows={3}
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
                <Link to="/appointments">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  {confirmed ? "Update booking" : "Book appointment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium">{v}</dd>
    </div>
  );
}