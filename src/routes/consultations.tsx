import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchConsultations, fetchDoctors, fetchPatients, fetchReferrals, referralCode } from "@/lib/app-data";
import { useRealtimeTables } from "@/lib/realtime";
import { toast } from "sonner";

export const Route = createFileRoute("/consultations")({
  head: () => ({ meta: [{ title: "Consultations — Refera" }] }),
  component: ConsultsPage,
});

function ConsultsPage() {
  useRealtimeTables(["consultations", "patients", "doctors", "referrals"], [["consultations"], ["patients"], ["doctors"], ["referrals"]]);
  const { data: consultations = [] } = useQuery({ queryKey: ["consultations"], queryFn: fetchConsultations });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });
  const { data: referrals = [] } = useQuery({ queryKey: ["referrals"], queryFn: fetchReferrals });
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return consultations;
    return consultations.filter((c) => {
      const p = patients.find((x) => x.id === c.patient_id);
      const d = doctors.find((x) => x.id === c.doctor_id);
      return `${p?.name ?? ""} ${d?.name ?? ""} ${c.summary ?? ""} ${c.recommendations ?? ""}`.toLowerCase().includes(term);
    });
  }, [consultations, patients, doctors, q]);
  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Consultations</h1>
            <p className="text-sm text-muted-foreground mt-1">Live outcome notes returned by specialists.</p>
          </div>
          <NewConsultationDialog patients={patients} doctors={doctors} referrals={referrals} />
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by patient, doctor, notes…" className="pl-9 h-9 bg-input/60" />
        </div>
        <div className="space-y-3">
          {rows.map((c) => {
            const p = patients.find((x) => x.id === c.patient_id);
            const sp = doctors.find((x) => x.id === c.doctor_id);
            const r = referrals.find((x) => x.id === c.referral_id);
            return (
              <Card key={c.id} className="glass-panel border-border/60"><CardContent className="p-5 space-y-3"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{r ? <Link to="/referrals/$id" params={{ id: r.id }} className="text-sm font-medium hover:underline">{p?.name ?? "Unknown patient"} · {r.specialty ?? referralCode(r)}</Link> : <span className="text-sm font-medium">{p?.name ?? "Unknown patient"}</span>}</div><div className="text-xs text-muted-foreground mt-0.5">{sp?.name ?? "Doctor"} · {new Date(c.consultation_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</div></div></div><div className="grid sm:grid-cols-3 gap-4 text-sm"><Field label="Summary">{c.summary ?? "—"}</Field><Field label="Recommendations">{c.recommendations ?? "—"}</Field><Field label="Follow-up">{c.follow_up ?? "—"}</Field></div></CardContent></Card>
            );
          })}
          {rows.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No consultations match your search.</div>}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div><div className="mt-1 leading-relaxed">{children}</div></div>;
}

type Patients = Awaited<ReturnType<typeof fetchPatients>>;
type Doctors = Awaited<ReturnType<typeof fetchDoctors>>;
type Referrals = Awaited<ReturnType<typeof fetchReferrals>>;

function NewConsultationDialog({ patients, doctors, referrals }: { patients: Patients; doctors: Doctors; referrals: Referrals }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    referral_id: "",
    consultation_date: new Date().toISOString().slice(0, 16),
    summary: "",
    recommendations: "",
    follow_up: "",
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) return toast.error("Select a patient");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return toast.error("Please sign in first");
    setSaving(true);
    const { error } = await supabase.from("consultations").insert({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id || null,
      referral_id: form.referral_id || null,
      consultation_date: new Date(form.consultation_date).toISOString(),
      summary: form.summary || null,
      recommendations: form.recommendations || null,
      follow_up: form.follow_up || null,
      created_by: auth.user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Consultation saved");
    setOpen(false);
    setForm({ patient_id: "", doctor_id: "", referral_id: "", consultation_date: new Date().toISOString().slice(0, 16), summary: "", recommendations: "", follow_up: "" });
    qc.invalidateQueries({ queryKey: ["consultations"] });
  };
  const relevantReferrals = form.patient_id ? referrals.filter((r) => r.patient_id === form.patient_id) : referrals;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4" /> New consultation</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New consultation</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Patient *">
            <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value, referral_id: "" })} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Select…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Doctor">
            <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">—</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Linked referral">
            <select value={form.referral_id} onChange={(e) => setForm({ ...form, referral_id: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">—</option>
              {relevantReferrals.map((r) => <option key={r.id} value={r.id}>{referralCode(r)} · {r.specialty ?? "general"}</option>)}
            </select>
          </FormField>
          <FormField label="Date & time"><Input type="datetime-local" value={form.consultation_date} onChange={(e) => setForm({ ...form, consultation_date: e.target.value })} /></FormField>
          <div className="sm:col-span-2"><FormField label="Summary"><Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></FormField></div>
          <div className="sm:col-span-2"><FormField label="Recommendations"><Textarea rows={2} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></FormField></div>
          <div className="sm:col-span-2"><FormField label="Follow-up plan"><Textarea rows={2} value={form.follow_up} onChange={(e) => setForm({ ...form, follow_up: e.target.value })} /></FormField></div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save consultation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}