import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ALL_HEALIX_ROLES, type HealixRole } from "@/lib/healix/rbac";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/healix/settings")({
  head: () => ({
    meta: [
      { title: "Settings — HEALIX AI" },
      { name: "description", content: "Configure organization, FHIR endpoint and roles." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [org, setOrg] = useState("Healix General Hospital");
  const [fhirMode, setFhirMode] = useState<"mock" | "rest">("mock");
  const [fhirBase, setFhirBase] = useState("https://fhir.example.com/r4");
  const [hipaa, setHipaa] = useState(true);
  const [audit, setAudit] = useState(true);
  const [role, setRole] = useState<HealixRole>("Doctor");

  return (
    <HealixShell title="Settings" subtitle="Organization, FHIR & security">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Organization</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Organization name</Label>
              <Input value={org} onChange={(e) => setOrg(e.target.value)} />
            </div>
            <div>
              <Label>Active role (demo)</Label>
              <Select value={role} onValueChange={(v) => setRole(v as HealixRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_HEALIX_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => toast.success("Saved")} className="bg-gradient-primary text-primary-foreground">Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">FHIR R4 endpoint</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <div className="text-sm font-medium">Use mock data</div>
                <div className="text-[11px] text-muted-foreground">Switch off to hit the configured FHIR REST endpoint.</div>
              </div>
              <Switch checked={fhirMode === "mock"} onCheckedChange={(v) => setFhirMode(v ? "mock" : "rest")} />
            </div>
            <div>
              <Label>FHIR base URL</Label>
              <Input value={fhirBase} onChange={(e) => setFhirBase(e.target.value)} disabled={fhirMode === "mock"} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Production wiring requires <code>VITE_HEALIX_FHIR_MODE=rest</code> and a token in Lovable Cloud secrets.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Security & compliance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="HIPAA-compliant audit logging" checked={hipaa} onChange={setHipaa} />
            <Row label="Detailed user access trail" checked={audit} onChange={setAudit} />
            <Row label="2FA required for prescribers" checked={true} onChange={() => {}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Integrations</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <IntegrationRow name="Lovable AI Gateway" status="Connected" />
            <IntegrationRow name="WhatsApp Business" status="Not configured" />
            <IntegrationRow name="SMS — Twilio" status="Not configured" />
            <IntegrationRow name="Payment — Razorpay" status="Not configured" />
            <IntegrationRow name="Telemedicine — WebRTC" status="Beta" />
          </CardContent>
        </Card>
      </div>
    </HealixShell>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
      <div className="text-sm">{label}</div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function IntegrationRow({ name, status }: { name: string; status: string }) {
  const tone = status === "Connected" ? "text-[oklch(var(--status-success))]" : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-2 last:border-b-0">
      <span>{name}</span>
      <span className={tone}>{status}</span>
    </div>
  );
}