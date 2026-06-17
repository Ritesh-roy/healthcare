import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchAppointments, fetchConsultations, fetchDoctors, fetchPatients, fetchReferrals, formatMrn, priorityMeta, referralCode, statusMeta } from "@/lib/app-data";
import { useRealtimeTables } from "@/lib/realtime";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/referrals/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — Refera` }] }),
  loader: async ({ params }) => ({ id: params.id }),
  component: ReferralDetail,
  notFoundComponent: () => (
    <AppShell><div className="px-6 py-12 text-center"><h1 className="text-xl font-semibold">Referral not found</h1><Link to="/referrals" className="text-sm text-primary mt-2 inline-block">Back to referrals</Link></div></AppShell>
  ),
  errorComponent: ({ error }) => <AppShell><div className="px-6 py-12 text-center text-sm text-muted-foreground">{error.message}</div></AppShell>,
});

function ReferralDetail() {
  const { id } = Route.useLoaderData();
  const qc = useQueryClient();
  useRealtimeTables(["referrals", "patients", "doctors", "appointments", "consultations"], [["referrals"], ["patients"], ["doctors"], ["appointments"], ["consultations"]]);
  const { data: referrals = [] } = useQuery({ queryKey: ["referrals"], queryFn: fetchReferrals });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });
  const { data: appointments = [] } = useQuery({ queryKey: ["appointments"], queryFn: fetchAppointments });
  const { data: consultations = [] } = useQuery({ queryKey: ["consultations"], queryFn: fetchConsultations });
  const r = referrals.find((x) => x.id === id);
  if (!r) throw notFound();
  const p = patients.find((x) => x.id === r.patient_id);
  const sp = doctors.find((x) => x.id === r.to_doctor_id);
  const sm = statusMeta(r.status);
  const pm = priorityMeta(r.priority);
  const ap = appointments.find((a) => a.referral_id === r.id);
  const con = consultations.find((c) => c.referral_id === r.id);

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("referrals").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Referral ${status}`);
    qc.invalidateQueries({ queryKey: ["referrals"] });
  };

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1280px] mx-auto space-y-5">
        <Link to="/referrals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All referrals</Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap"><h1 className="text-2xl font-semibold tracking-tight">{p?.name ?? "Unknown patient"}</h1><StatusBadge tone={pm.tone}>{pm.label}</StatusBadge><StatusBadge tone={sm.tone}>{sm.label}</StatusBadge></div>
            <p className="text-sm text-muted-foreground mt-1">{referralCode(r)} · {p ? formatMrn(p) : "No MRN"} · {r.specialty ?? "Referral"} → {sp?.name ?? "Unassigned doctor"}</p>
          </div>
          <div className="flex items-center gap-2">
            {r.status === "submitted" && <><Button variant="outline" onClick={() => setStatus("rejected")}><XCircle className="h-4 w-4 mr-1" /> Decline</Button><Button onClick={() => setStatus("accepted")} className="bg-gradient-primary text-primary-foreground shadow-glow"><CheckCircle2 className="h-4 w-4 mr-1" /> Accept</Button></>}
            {r.status === "accepted" && <Link to="/appointments/new"><Button className="bg-gradient-primary text-primary-foreground shadow-glow"><CalendarDays className="h-4 w-4 mr-1" /> Book appointment</Button></Link>}
            {r.status === "scheduled" && <Button onClick={() => setStatus("completed")} className="bg-gradient-primary text-primary-foreground shadow-glow"><FileText className="h-4 w-4 mr-1" /> Mark completed</Button>}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-panel border-border/60"><CardHeader><CardTitle className="text-base">Clinical detail</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><Field label="Reason">{r.reason ?? "—"}</Field><Field label="Provisional diagnosis">{r.diagnosis ?? "—"}</Field><Field label="Active problems">{(p?.problems ?? []).join(" · ") || "—"}</Field>{r.notes && <Field label="Notes">{r.notes}</Field>}</CardContent></Card>
            {con && <Card className="glass-panel border-border/60"><CardHeader><CardTitle className="text-base">Consultation outcome</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Field label="Summary">{con.summary ?? "—"}</Field><Field label="Recommendations">{con.recommendations ?? "—"}</Field><Field label="Follow-up">{con.follow_up ?? "—"}</Field></CardContent></Card>}
          </div>
          <div className="space-y-4">
            <Card className="glass-panel border-border/60"><CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Field label="Patient">{p?.name ?? "—"}</Field><Field label="Doctor">{sp?.name ?? "—"}</Field><Field label="Specialty">{sp?.specialty ?? r.specialty ?? "—"}</Field>{ap && <Field label="Appointment">{new Date(ap.starts_at).toLocaleString()}</Field>}</CardContent></Card>
            <Card className="glass-panel border-border/60"><CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><Field label="Created">{new Date(r.created_at).toLocaleString()}</Field><Field label="Updated">{new Date(r.updated_at).toLocaleString()}</Field><Field label="Status">{sm.label}</Field></CardContent></Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div><div className="mt-1 leading-relaxed">{children}</div></div>;
}