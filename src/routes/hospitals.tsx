import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarPlus, MapPin, Phone, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchDoctors, fetchHospitals } from "@/lib/app-data";
import { useRealtimeTables } from "@/lib/realtime";
import { toast } from "sonner";

export const Route = createFileRoute("/hospitals")({
  head: () => ({ meta: [{ title: "Hospitals — Refera" }] }),
  component: HospitalsPage,
});

function HospitalsPage() {
  useRealtimeTables(["hospitals", "doctors"], [["hospitals"], ["doctors"]]);
  const { data: hospitals = [] } = useQuery({ queryKey: ["hospitals"], queryFn: fetchHospitals });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return hospitals;
    return hospitals.filter((h) => `${h.name} ${h.type} ${h.address ?? ""} ${h.phone ?? ""}`.toLowerCase().includes(term));
  }, [hospitals, q]);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Hospitals
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Live hospital and clinic directory.</p>
          </div>
          <NewHospitalDialog />
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hospital, clinic, city, phone…" className="pl-9 h-9 bg-input/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((h) => {
            const linkedDoctors = doctors.filter((d) => d.hospital_id === h.id);
            return (
              <Card key={h.id} className="glass-panel border-border/60 overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-semibold truncate">{h.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {h.address ?? "Address not set"}
                      </div>
                    </div>
                    <Badge variant={h.status === "active" ? "secondary" : "outline"} className="text-[10px]">{h.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <Stat label="Doctors" value={`${linkedDoctors.length}`} />
                    <Stat label="Status" value={h.status} />
                  </div>
                  <div className="space-y-1.5 border-t border-border pt-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Linked doctors</div>
                    {linkedDoctors.slice(0, 4).map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{d.name}</span>
                        <span className="text-[11px] text-muted-foreground">{d.specialty ?? "—"}</span>
                      </div>
                    ))}
                    {linkedDoctors.length === 0 && <div className="text-sm text-muted-foreground">No doctors linked yet.</div>}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {h.phone ?? "—"}</div>
                    <Link to="/appointments/new"><Button size="sm" className="gap-1.5 bg-gradient-primary text-primary-foreground"><CalendarPlus className="h-4 w-4" /> Book</Button></Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {rows.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-12">No hospitals match your search.</div>}
        </div>
      </div>
    </AppShell>
  );
}

function NewHospitalDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Hospital", address: "", phone: "", email: "", notes: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Hospital name is required");
    setSaving(true);
    const { error } = await supabase.from("hospitals").insert({
      name: form.name.trim(), type: form.type, address: form.address || null, phone: form.phone || null, email: form.email || null, notes: form.notes || null, status: "active",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Hospital added");
    setOpen(false);
    setForm({ name: "", type: "Hospital", address: "", phone: "", email: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["hospitals"] });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4" /> Add new hospital</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add new hospital / clinic</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"><option>Hospital</option><option>Clinic</option></select></Field>
          <div className="sm:col-span-2"><Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
          <Field label="Phone"><Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
          <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add hospital"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border bg-card/40 px-2 py-1.5"><div className="text-sm font-semibold tabular-nums">{value}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div></div>;
}