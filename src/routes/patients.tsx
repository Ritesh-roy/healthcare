import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchPatients, fetchReferrals, formatMrn } from "@/lib/app-data";
import { useRealtimeTables } from "@/lib/realtime";
import { toast } from "sonner";

export const Route = createFileRoute("/patients")({
  head: () => ({ meta: [{ title: "Patients — Refera" }] }),
  component: PatientsPage,
});

function PatientsPage() {
  useRealtimeTables(["patients", "referrals"], [["patients"], ["referrals"]]);
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const { data: referrals = [] } = useQuery({ queryKey: ["referrals"], queryFn: fetchReferrals });
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) => `${p.name} ${formatMrn(p)} ${p.phone ?? ""} ${(p.problems ?? []).join(" ")}`.toLowerCase().includes(term));
  }, [patients, q]);
  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
            <p className="text-sm text-muted-foreground mt-1">Live patient panel across your practice.</p>
          </div>
          <NewPatientDialog />
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients, MRN, phone, illness…" className="pl-9 h-9 bg-input/60" />
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
                {rows.map((p) => {
                const count = referrals.filter((r) => r.patient_id === p.id).length;
                return (
                  <div key={p.id} className="grid grid-cols-12 items-center px-5 py-3.5 text-sm hover:bg-accent/40 transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-xs font-semibold">
                        {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{formatMrn(p)} · {p.sex ?? "—"}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-muted-foreground tabular-nums">{p.dob ?? "—"}</div>
                    <div className="col-span-3 text-muted-foreground truncate">{(p.problems ?? []).join(", ") || "—"}</div>
                    <div className="col-span-2 text-muted-foreground tabular-nums">{p.phone ?? "—"}</div>
                    <div className="col-span-1 text-right font-medium">{count}</div>
                  </div>
                );
              })}
              {rows.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted-foreground">No patients match your search.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function NewPatientDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", mrn: "", dob: "", sex: "F", phone: "", email: "", problems: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Patient name is required");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return toast.error("Please sign in with a cloud account before adding patients.");
    setSaving(true);
    const { error } = await supabase.from("patients").insert({
      name: form.name.trim(),
      mrn: form.mrn || null,
      dob: form.dob || null,
      sex: form.sex,
      phone: form.phone || null,
      email: form.email || null,
      problems: form.problems.split(",").map((p) => p.trim()).filter(Boolean),
      created_by: auth.user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Patient added");
    setOpen(false);
    setForm({ name: "", mrn: "", dob: "", sex: "F", phone: "", email: "", problems: "" });
    qc.invalidateQueries({ queryKey: ["patients"] });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4" /> Add new patient</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add new patient</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="MRN"><Input value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} /></Field>
          <Field label="Date of birth"><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
          <Field label="Sex"><select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"><option value="F">Female</option><option value="M">Male</option><option value="Other">Other</option></select></Field>
          <Field label="Phone"><Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Active problems"><Input value={form.problems} onChange={(e) => setForm({ ...form, problems: e.target.value })} placeholder="Diabetes, asthma" /></Field></div>
          <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add patient"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}