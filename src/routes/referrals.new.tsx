import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/ui/required-label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchDoctors, fetchPatients, formatMrn } from "@/lib/app-data";
import { useRealtimeTables } from "@/lib/realtime";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/referrals/new")({
  head: () => ({ meta: [{ title: "Refer patient — Refera" }] }),
  component: NewReferral,
});

function NewReferral() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  useRealtimeTables(["patients", "doctors", "referrals"], [["patients"], ["doctors"], ["referrals"]]);
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });
  const specialties = useMemo(() => Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean))).sort() as string[], [doctors]);
  const [form, setForm] = useState({ patient_id: "", specialty: "", to_doctor_id: "", priority: "routine", reason: "", diagnosis: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const filteredDoctors = doctors.filter((d) => d.status === "active" && (!form.specialty || d.specialty === form.specialty));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id || !form.to_doctor_id || !form.reason.trim()) return toast.error("Patient, doctor and reason are required.");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return toast.error("Please sign in with a cloud account before referring a patient.");
    setSaving(true);
    const { data, error } = await supabase
      .from("referrals")
      .insert({
        patient_id: form.patient_id,
        from_user_id: auth.user.id,
        to_doctor_id: form.to_doctor_id,
        specialty: form.specialty || null,
        priority: form.priority,
        reason: form.reason.trim(),
        diagnosis: form.diagnosis.trim() || null,
        notes: form.notes.trim() || null,
        status: "submitted",
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Patient referred");
    qc.invalidateQueries({ queryKey: ["referrals"] });
    if (data?.id) navigate({ to: "/referrals/$id", params: { id: data.id } });
    else navigate({ to: "/referrals" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3">
          <Link to="/referrals"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-semibold tracking-tight">Refer patient</h1><p className="text-sm text-muted-foreground mt-1">Send a live referral to any active doctor.</p></div>
        </div>
        <Card className="glass-panel border-border/60">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Referral details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Patient *"><Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger><SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {formatMrn(p)}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Specialty"><Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v, to_doctor_id: "" })}><SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger><SelectContent>{specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Doctor *"><Select value={form.to_doctor_id} onValueChange={(v) => setForm({ ...form, to_doctor_id: v, specialty: form.specialty || doctors.find((d) => d.id === v)?.specialty || "" })}><SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger><SelectContent>{filteredDoctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} · {d.specialty ?? "Doctor"}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Priority"><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="routine">Routine</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select></Field>
              <div className="sm:col-span-2"><Field label="Reason *"><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="min-h-[110px]" /></Field></div>
              <div className="sm:col-span-2"><Field label="Diagnosis"><Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Admin / clinical notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
              <div className="sm:col-span-2 flex justify-end gap-2"><Link to="/referrals"><Button type="button" variant="outline">Cancel</Button></Link><Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground shadow-glow">{saving ? "Sending…" : "Refer patient"}</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><FieldLabel label={label} />{children}</div>;
}