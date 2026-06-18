import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, Footprints } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchDoctors, fetchPatients, ageFromDob } from "@/lib/app-data";
import {
  CIRCULATION_OPTIONS,
  RECOMMENDATION_OPTIONS,
  SYMPTOM_OPTIONS,
  computeRiskLevel,
  riskTone,
} from "@/lib/foot-assessments";
import { toast } from "sonner";

export const Route = createFileRoute("/foot-assessments/new")({
  head: () => ({ meta: [{ title: "New Foot Assessment — Refera" }] }),
  component: NewFootAssessment,
});

function NewFootAssessment() {
  const navigate = useNavigate();
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("F");
  const [phone, setPhone] = useState("");
  const [diabetes, setDiabetes] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [prevSurgery, setPrevSurgery] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [leftToe, setLeftToe] = useState("");
  const [rightToe, setRightToe] = useState("");
  const [leftFoot, setLeftFoot] = useState("");
  const [rightFoot, setRightFoot] = useState("");
  const [circulation, setCirculation] = useState("Normal");
  const [remarks, setRemarks] = useState("");
  const [observations, setObservations] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handlePatientSelect = (id: string) => {
    setPatientId(id);
    const p = patients.find((x) => x.id === id);
    if (p) {
      setName(p.name);
      const ageStr = ageFromDob(p.dob);
      if (ageStr !== "—") setAge(ageStr);
      if (p.sex) setGender(p.sex);
      if (p.phone) setPhone(p.phone);
    }
  };

  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

  const risk = useMemo(() => computeRiskLevel({
    left_toe_pressure: numOrNull(leftToe),
    right_toe_pressure: numOrNull(rightToe),
    circulation_status: circulation,
    diabetes, smoking, symptoms,
  }), [leftToe, rightToe, circulation, diabetes, smoking, symptoms]);

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return toast.error("Select a patient");
    if (!name.trim()) return toast.error("Patient name required");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return toast.error("Please sign in first");
    setSaving(true);
    const doctor = doctors.find((d) => d.id === doctorId);
    const payload = {
      patient_id: patientId,
      doctor_id: doctorId || null,
      patient_name: name.trim(),
      patient_age: age ? Number(age) : null,
      patient_gender: gender,
      patient_phone: phone || null,
      diabetes, hypertension, smoking,
      previous_foot_surgery: prevSurgery,
      symptoms,
      left_toe_pressure: numOrNull(leftToe),
      right_toe_pressure: numOrNull(rightToe),
      left_foot_pressure: numOrNull(leftFoot),
      right_foot_pressure: numOrNull(rightFoot),
      circulation_status: circulation,
      doctor_remarks: remarks || null,
      observations: observations || null,
      diagnosis_notes: diagnosis || null,
      recommendations,
      risk_level: risk,
      doctor_name: doctor?.name ?? null,
      created_by: auth.user.id,
    };
    const { data, error } = await supabase
      .from("foot_assessments" as never)
      .insert(payload as never)
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Assessment saved");
    const newId = (data as unknown as { id: string }).id;
    navigate({ to: "/foot-assessments/$id", params: { id: newId } });
  };

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/foot-assessments" })} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Footprints className="h-5 w-5 text-primary" /> New Foot & Toe Pressure Assessment
            </h1>
          </div>
          <Badge variant="outline" className={riskTone(risk)}>Estimated risk: {risk}</Badge>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <Section title="Patient Information">
            <div className="grid sm:grid-cols-2 gap-3">
              <FieldRow label="Patient record *">
                <select required value={patientId} onChange={(e) => handlePatientSelect(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">Select existing patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name} {p.phone ? `· ${p.phone}` : ""}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Attending doctor">
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">—</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Full name *"><Input required value={name} onChange={(e) => setName(e.target.value)} /></FieldRow>
              <FieldRow label="Age"><Input type="number" inputMode="numeric" min="0" max="130" value={age} onChange={(e) => setAge(e.target.value)} /></FieldRow>
              <FieldRow label="Gender">
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="F">Female</option><option value="M">Male</option><option value="Other">Other</option>
                </select>
              </FieldRow>
              <FieldRow label="Mobile number"><Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></FieldRow>
            </div>
          </Section>

          <Section title="Medical History">
            <div className="grid sm:grid-cols-2 gap-3">
              <Toggle label="Diabetes" value={diabetes} onChange={setDiabetes} />
              <Toggle label="High Blood Pressure" value={hypertension} onChange={setHypertension} />
              <Toggle label="Smoking History" value={smoking} onChange={setSmoking} />
              <Toggle label="Previous Foot Surgery" value={prevSurgery} onChange={setPrevSurgery} />
            </div>
          </Section>

          <Section title="Symptoms">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SYMPTOM_OPTIONS.map((s) => (
                <CheckRow key={s} label={s} checked={symptoms.includes(s)} onChange={() => toggle(symptoms, setSymptoms, s)} />
              ))}
            </div>
          </Section>

          <Section title="Foot & Toe Pressure Measurements">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FieldRow label="Left Toe (mmHg)"><Input type="number" inputMode="decimal" min="0" value={leftToe} onChange={(e) => setLeftToe(e.target.value)} /></FieldRow>
              <FieldRow label="Right Toe (mmHg)"><Input type="number" inputMode="decimal" min="0" value={rightToe} onChange={(e) => setRightToe(e.target.value)} /></FieldRow>
              <FieldRow label="Left Foot (mmHg)"><Input type="number" inputMode="decimal" min="0" value={leftFoot} onChange={(e) => setLeftFoot(e.target.value)} /></FieldRow>
              <FieldRow label="Right Foot (mmHg)"><Input type="number" inputMode="decimal" min="0" value={rightFoot} onChange={(e) => setRightFoot(e.target.value)} /></FieldRow>
              <div className="sm:col-span-2 lg:col-span-4">
                <FieldRow label="Blood circulation status">
                  <select value={circulation} onChange={(e) => setCirculation(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                    {CIRCULATION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FieldRow>
              </div>
            </div>
          </Section>

          <Section title="Clinical Notes">
            <div className="grid sm:grid-cols-3 gap-3">
              <FieldRow label="Doctor remarks"><Textarea rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></FieldRow>
              <FieldRow label="Observations"><Textarea rows={4} value={observations} onChange={(e) => setObservations(e.target.value)} /></FieldRow>
              <FieldRow label="Diagnosis notes"><Textarea rows={4} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></FieldRow>
            </div>
          </Section>

          <Section title="Recommendations">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RECOMMENDATION_OPTIONS.map((r) => (
                <CheckRow key={r} label={r} checked={recommendations.includes(r)} onChange={() => toggle(recommendations, setRecommendations, r)} />
              ))}
            </div>
          </Section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/foot-assessments" })}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save assessment"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="glass-panel border-border/60">
      <CardContent className="p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer">
      <span>{label}</span>
      <div className="flex gap-3 text-xs">
        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={value} onChange={() => onChange(true)} /> Yes</label>
        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!value} onChange={() => onChange(false)} /> No</label>
      </div>
    </label>
  );
}
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent/40">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}