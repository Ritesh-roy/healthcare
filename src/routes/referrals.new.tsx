import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { patients, practitioners, specialties } from "@/lib/mock-data";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Paperclip, Upload, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/referrals/new")({
  head: () => ({
    meta: [
      { title: "New referral — Refera" },
      { name: "description", content: "Create a new specialist referral with patient context, clinical detail, and attachments." },
    ],
  }),
  component: NewReferral,
});

const steps = ["Patient", "Clinical", "Specialist", "Attachments", "Review"] as const;

function NewReferral() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [patientId, setPatientId] = useState(patients[0].id);
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [specialty, setSpecialty] = useState(specialties[0]);
  const [specialistId, setSpecialistId] = useState(
    practitioners.find((p) => p.role === "Specialist")!.id,
  );
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

  const patient = patients.find((p) => p.id === patientId)!;
  const specialist = practitioners.find((p) => p.id === specialistId)!;

  const submit = () => {
    toast.success("Referral submitted", {
      description: `${patient.name} → ${specialist.name} (${specialty})`,
    });
    navigate({ to: "/referrals" });
  };

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New referral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            FHIR ServiceRequest · auto-populated from patient record.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-full grid place-items-center text-xs font-semibold border transition-colors",
                  i < step
                    ? "bg-gradient-primary text-primary-foreground border-transparent"
                    : i === step
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className={cn("text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Card className="glass-panel border-border/60">
          <CardHeader>
            <CardTitle className="text-base">{steps[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {p.mrn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg border border-border bg-card/40 p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent grid place-items-center">
                    <User2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{patient.name}</div>
                    <div className="text-xs text-muted-foreground">
                      DOB {patient.dob} · {patient.sex} · {patient.phone}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Active problems: {patient.problems.join(", ")}
                    </div>
                  </div>
                </div>
                <label className="flex items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-muted-foreground">
                    I confirm the patient has consented to sharing their record with this specialist.
                  </span>
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reason for referral</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Brief clinical question…"
                    className="min-h-[88px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provisional diagnosis</Label>
                  <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Persistent atrial fibrillation" />
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specialist</Label>
                  <Select value={specialistId} onValueChange={setSpecialistId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {practitioners.filter((p) => p.role === "Specialist").map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {p.specialty} · {p.organization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/30 p-8 text-center cursor-pointer hover:bg-card/60 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="text-sm font-medium">Drop files or click to upload</div>
                  <div className="text-xs text-muted-foreground">PDF, JPG, PNG up to 20 MB each</div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const list = Array.from(e.target.files ?? []).map((f) => ({
                        name: f.name,
                        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
                      }));
                      setFiles((cur) => [...cur, ...list]);
                    }}
                  />
                </label>
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.size}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3 text-sm">
                <Row k="Patient" v={`${patient.name} · ${patient.mrn}`} />
                <Row k="Specialist" v={`${specialist.name} (${specialty})`} />
                <Row k="Urgency" v={urgency.charAt(0).toUpperCase() + urgency.slice(1)} />
                <Row k="Reason" v={reason || "—"} />
                <Row k="Diagnosis" v={diagnosis || "—"} />
                <Row k="Attachments" v={files.length ? `${files.length} file(s)` : "None"} />
                <Row k="Consent" v={consent ? "Confirmed" : "Not confirmed"} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !consent}
              className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
              <Check className="h-4 w-4" /> Submit referral
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <div className="text-muted-foreground">{k}</div>
      <div className="text-right max-w-[60%]">{v}</div>
    </div>
  );
}