import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchAppointments, fetchDoctors, fetchHospitals, fetchPatients, fetchReferrals, formatMrn } from "@/lib/app-data";
import { useRealtimeTables } from "@/lib/realtime";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments/new")({
  head: () => ({ meta: [{ title: "Book appointment — Refera" }] }),
  component: NewAppointmentPage,
});

function NewAppointmentPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  useRealtimeTables(["appointments", "patients", "doctors", "hospitals", "referrals"], [["appointments"], ["patients"], ["doctors"], ["hospitals"], ["referrals"]]);
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });
  const { data: hospitals = [] } = useQuery({ queryKey: ["hospitals"], queryFn: fetchHospitals });
  const { data: referrals = [] } = useQuery({ queryKey: ["referrals"], queryFn: fetchReferrals });
  const { data: appointments = [] } = useQuery({ queryKey: ["appointments"], queryFn: fetchAppointments });
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", hospital_id: "", referral_id: "none", date: today, time: "09:00", duration_min: "30", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const slotConflict = useMemo(() => appointments.some((a) => a.doctor_id === form.doctor_id && new Date(a.starts_at).toISOString() === new Date(`${form.date}T${form.time}`).toISOString()), [appointments, form]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id || !form.date || !form.time) return toast.error("Patient, doctor, date and time are required.");
    if (slotConflict) return toast.error("That doctor already has an appointment at this time.");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return toast.error("Please sign in with a cloud account before booking.");
    setSaving(true);
    const { error } = await supabase.from("appointments").insert({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      hospital_id: form.hospital_id || null,
      referral_id: form.referral_id === "none" ? null : form.referral_id,
      starts_at: new Date(`${form.date}T${form.time}`).toISOString(),
      duration_min: Number(form.duration_min) || 30,
      location: form.location || null,
      notes: form.notes || null,
      created_by: auth.user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment booked");
    qc.invalidateQueries({ queryKey: ["appointments"] });
    navigate({ to: "/appointments" });
  };
  return (
    <AppShell><div className="px-4 sm:px-6 py-5 sm:py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3"><Link to="/appointments"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link><div><h1 className="text-2xl font-semibold tracking-tight">Book appointment</h1><p className="text-sm text-muted-foreground mt-1">Create a live appointment record.</p></div></div>
      <Card className="glass-panel border-border/60"><CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-primary" /> Appointment details</CardTitle></CardHeader><CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Patient *"><Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger><SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {formatMrn(p)}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Doctor *"><Select value={form.doctor_id} onValueChange={(v) => setForm({ ...form, doctor_id: v })}><SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger><SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} · {d.specialty ?? "Doctor"}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Hospital / clinic"><Select value={form.hospital_id} onValueChange={(v) => setForm({ ...form, hospital_id: v })}><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent>{hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Linked referral"><Select value={form.referral_id} onValueChange={(v) => setForm({ ...form, referral_id: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{referrals.map((r) => <SelectItem key={r.id} value={r.id}>{r.ref_code ?? r.id} · {r.specialty ?? "Referral"}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Date *"><Input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time *"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Duration (minutes)"><Input type="number" min="5" step="5" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></Field>
          <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
          {slotConflict && <div className="sm:col-span-2 text-sm text-destructive">This doctor already has an appointment at that exact time.</div>}
          <div className="sm:col-span-2 flex justify-end gap-2"><Link to="/appointments"><Button type="button" variant="outline">Cancel</Button></Link><Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground shadow-glow">{saving ? "Saving…" : "Book appointment"}</Button></div>
        </form>
      </CardContent></Card>
    </div></AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}