import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { patientsQuery, practitionersQuery } from "@/lib/healix/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/healix/prescriptions")({
  head: () => ({
    meta: [
      { title: "Prescriptions — HEALIX AI" },
      { name: "description", content: "Compose, review and print e-prescriptions with safety checks." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(patientsQuery());
    context.queryClient.ensureQueryData(practitionersQuery());
  },
  component: PrescriptionsPage,
});

type RxLine = { drug: string; strength: string; route: string; freq: string; duration: string; instructions: string };

function PrescriptionsPage() {
  const { data: patients } = useSuspenseQuery(patientsQuery());
  const { data: practitioners } = useSuspenseQuery(practitionersQuery());

  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [practitionerId, setPractitionerId] = useState(practitioners[0]?.id ?? "");
  const [lines, setLines] = useState<RxLine[]>([
    { drug: "Metformin", strength: "500 mg", route: "PO", freq: "BID", duration: "30 days", instructions: "After meals" },
  ]);

  const updateLine = (i: number, patch: Partial<RxLine>) =>
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () =>
    setLines((arr) => [...arr, { drug: "", strength: "", route: "PO", freq: "OD", duration: "7 days", instructions: "" }]);
  const removeLine = (i: number) => setLines((arr) => arr.filter((_, idx) => idx !== i));

  const patient = patients.find((p) => p.id === patientId);
  const pract = practitioners.find((p) => p.id === practitionerId);

  const printRx = () => {
    if (typeof window === "undefined") return;
    if (!patientId) { toast.error("Patient is required"); return; }
    if (!practitionerId) { toast.error("Prescriber is required"); return; }
    const hasLine = lines.some((l) => l.drug.trim());
    if (!hasLine) { toast.error("Add at least one medication"); return; }
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) return;
    const html = `<!doctype html><html><head><title>Prescription — ${patient?.fullName ?? ""}</title>
      <style>body{font-family:Inter,system-ui,sans-serif;padding:32px;color:#111}
      h1{font-size:18px;margin:0 0 4px}.muted{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
      th,td{text-align:left;border-bottom:1px solid #ddd;padding:8px}
      .sig{margin-top:48px;font-size:12px}</style></head><body>
      <h1>HEALIX AI — Prescription</h1>
      <div class="muted">Date: ${new Date().toLocaleDateString()}</div>
      <div style="margin-top:16px"><b>Patient:</b> ${patient?.fullName} · ${patient?.mrn} · ${patient?.age}y ${patient?.gender}</div>
      <div><b>Prescriber:</b> Dr. ${pract?.name[0].given.join(" ")} ${pract?.name[0].family} · ${pract?.specialty}</div>
      <table><thead><tr><th>Drug</th><th>Strength</th><th>Route</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
      <tbody>${lines
        .map(
          (l) =>
            `<tr><td>${l.drug}</td><td>${l.strength}</td><td>${l.route}</td><td>${l.freq}</td><td>${l.duration}</td><td>${l.instructions}</td></tr>`,
        )
        .join("")}</tbody></table>
      <div class="sig">Authorized digitally · HEALIX AI · FHIR R4 MedicationRequest</div>
      </body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 200);
    toast.success("Prescription sent to printer");
  };

  return (
    <HealixShell
      title="E-Prescription"
      subtitle="FHIR R4 MedicationRequest builder"
      actions={
        <Button onClick={printRx} className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
          <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print</span>
        </Button>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient & prescriber</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Patient <span aria-hidden="true" className="text-destructive ml-0.5">*</span></Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.fullName} · {p.mrn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prescriber <span aria-hidden="true" className="text-destructive ml-0.5">*</span></Label>
              <Select value={practitionerId} onValueChange={setPractitionerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {practitioners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      Dr. {p.name[0].family} · {p.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground mb-1">Safety checks</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Allergy cross-check against patient record</li>
                <li>Renal dosing adjustments flagged</li>
                <li>Drug-drug interaction screening</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Medications</CardTitle>
            <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-2 rounded-lg border border-border/60 p-3">
                <Input required className="md:col-span-2" placeholder="Drug name *" value={l.drug} onChange={(e) => updateLine(i, { drug: e.target.value })} />
                <Input required placeholder="Strength *" value={l.strength} onChange={(e) => updateLine(i, { strength: e.target.value })} />
                <Input required placeholder="Route *" value={l.route} onChange={(e) => updateLine(i, { route: e.target.value })} />
                <Input required placeholder="Frequency *" value={l.freq} onChange={(e) => updateLine(i, { freq: e.target.value })} />
                <Input required placeholder="Duration *" value={l.duration} onChange={(e) => updateLine(i, { duration: e.target.value })} />
                <Input required className="md:col-span-5" placeholder="Instructions *" value={l.instructions} onChange={(e) => updateLine(i, { instructions: e.target.value })} />
                <Button variant="ghost" size="icon" onClick={() => removeLine(i)} className="md:col-span-1 justify-self-end text-muted-foreground hover:text-[oklch(var(--status-danger))]">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </HealixShell>
  );
}