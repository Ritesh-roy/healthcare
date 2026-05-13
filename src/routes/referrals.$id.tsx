import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  appointments,
  consultations,
  getPatient,
  getPractitioner,
  getReferral,
  statusMeta,
  urgencyMeta,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/referrals/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Refera` },
      { name: "description", content: `Referral ${params.id}: clinical detail, status, and consultation outcome.` },
    ],
  }),
  loader: ({ params }) => {
    const r = getReferral(params.id);
    if (!r) throw notFound();
    return { referral: r };
  },
  component: ReferralDetail,
  notFoundComponent: () => (
    <AppShell>
      <div className="px-6 py-12 text-center">
        <h1 className="text-xl font-semibold">Referral not found</h1>
        <Link to="/referrals" className="text-sm text-primary mt-2 inline-block">Back to referrals</Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="px-6 py-12 text-center text-sm text-muted-foreground">{error.message}</div>
    </AppShell>
  ),
});

function ReferralDetail() {
  const { referral: r } = Route.useLoaderData();
  const p = getPatient(r.patientId)!;
  const gp = getPractitioner(r.fromGpId)!;
  const sp = getPractitioner(r.toSpecialistId)!;
  const sm = statusMeta(r.status);
  const um = urgencyMeta(r.urgency);
  const ap = appointments.find((a) => a.referralId === r.id);
  const con = consultations.find((c) => c.referralId === r.id);

  const timeline = [
    { icon: FileText, label: "Created", at: r.createdAt, by: gp.name },
    r.status !== "draft" && { icon: ShieldCheck, label: "Submitted", at: r.createdAt, by: gp.name },
    ["accepted", "scheduled", "completed"].includes(r.status) && { icon: CheckCircle2, label: "Accepted", at: r.updatedAt, by: sp.name },
    ap && { icon: CalendarDays, label: "Scheduled", at: ap.startsAt, by: sp.name },
    con && { icon: FileText, label: "Consultation completed", at: con.date, by: sp.name },
    r.status === "rejected" && { icon: XCircle, label: "Rejected", at: r.updatedAt, by: sp.name },
  ].filter(Boolean) as { icon: any; label: string; at: string; by: string }[];

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-5">
        <Link to="/referrals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All referrals
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
              <StatusBadge tone={um.tone}>{um.label}</StatusBadge>
              <StatusBadge tone={sm.tone}>{sm.label}</StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {r.id} · {p.mrn} · DOB {p.dob} · {r.specialty} → {sp.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {r.status === "submitted" && (
              <>
                <Button variant="outline" onClick={() => toast.message("Referral declined")}>Decline</Button>
                <Button onClick={() => toast.success("Referral accepted")} className="bg-gradient-primary text-primary-foreground shadow-glow">Accept</Button>
              </>
            )}
            {r.status === "accepted" && (
              <Button onClick={() => toast.success("Appointment requested")} className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
                <CalendarDays className="h-4 w-4" /> Schedule
              </Button>
            )}
            {r.status === "scheduled" && (
              <Button onClick={() => toast.success("Consultation saved")} className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
                <FileText className="h-4 w-4" /> Record consult
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-panel border-border/60">
              <CardHeader><CardTitle className="text-base">Clinical detail</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <Field label="Reason">{r.reason}</Field>
                <Field label="Provisional diagnosis">{r.diagnosis}</Field>
                <Field label="Active problems">{p.problems.join(" · ")}</Field>
                {r.notes && <Field label="Specialist notes">{r.notes}</Field>}
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60">
              <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
              <CardContent>
                {r.attachments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No attachments.</div>
                ) : (
                  <div className="space-y-2">
                    {r.attachments.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 truncate">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.size}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {con && (
              <Card className="glass-panel border-border/60">
                <CardHeader><CardTitle className="text-base">Consultation outcome</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Field label="Summary">{con.summary}</Field>
                  <Field label="Recommendations">{con.recommendations}</Field>
                  <Field label="Follow-up">{con.followUp}</Field>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="glass-panel border-border/60">
              <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Referring GP</div>
                  <div className="font-medium">{gp.name}</div>
                  <div className="text-xs text-muted-foreground">{gp.organization}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Specialist</div>
                  <div className="font-medium">{sp.name}</div>
                  <div className="text-xs text-muted-foreground">{sp.specialty} · {sp.organization}</div>
                </div>
                {ap && (
                  <div>
                    <div className="text-xs text-muted-foreground">Appointment</div>
                    <div className="font-medium">
                      {new Date(ap.startsAt).toLocaleString(undefined, {
                        weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">{ap.location}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Activity</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {timeline.map((t, i) => {
                    const Icon = t.icon;
                    return (
                      <li key={i} className="ml-4">
                        <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Icon className="h-3.5 w-3.5 text-primary" /> {t.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.by} · {new Date(t.at).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="mt-1 leading-relaxed">{children}</div>
    </div>
  );
}