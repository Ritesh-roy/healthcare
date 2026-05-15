import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getPatient,
  getPractitioner,
  statusMeta,
  urgencyMeta,
  type ReferralStatus,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { scopedReferrals } from "@/lib/scoped";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/referrals/")({
  head: () => ({
    meta: [
      { title: "Referrals — Refera" },
      { name: "description", content: "Triage queue: filter, search, and act on every referral." },
    ],
  }),
  component: ReferralsPage,
});

const filters: { id: "all" | ReferralStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "accepted", label: "Accepted" },
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
  { id: "draft", label: "Draft" },
];

function ReferralsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const { user } = useAuth();
  const referrals = scopedReferrals(user);

  const rows = useMemo(() => {
    return referrals
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter((r) => {
        if (!q.trim()) return true;
        const p = getPatient(r.patientId);
        const sp = getPractitioner(r.toSpecialistId);
        const hay = `${r.id} ${p?.name} ${p?.mrn} ${sp?.name} ${r.specialty} ${r.reason} ${r.diagnosis}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [filter, q]);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Triage, accept, schedule, and close referrals across your practice.
            </p>
          </div>
          <Link to="/referrals/new">
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5">
              <Plus className="h-4 w-4" /> New referral
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by patient, MRN, specialist, diagnosis…"
              className="pl-9 h-9 bg-input/60"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-card/40">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  filter === f.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="glass-panel border-border/60 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <div className="col-span-3">Patient</div>
              <div className="col-span-2">Specialty</div>
              <div className="col-span-3">Reason</div>
              <div className="col-span-1">Urgency</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Updated</div>
            </div>
            <div className="divide-y divide-border">
              {rows.map((r) => {
                const p = getPatient(r.patientId)!;
                const sp = getPractitioner(r.toSpecialistId)!;
                const sm = statusMeta(r.status);
                const um = urgencyMeta(r.urgency);
                const d = new Date(r.updatedAt);
                return (
                  <Link
                    key={r.id}
                    to="/referrals/$id"
                    params={{ id: r.id }}
                    className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-accent/40 transition-colors text-sm"
                  >
                    <div className="col-span-3 min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.id} · {p.mrn}
                      </div>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <div className="truncate">{r.specialty}</div>
                      <div className="text-xs text-muted-foreground truncate">{sp.name}</div>
                    </div>
                    <div className="col-span-3 min-w-0 text-muted-foreground truncate">
                      {r.reason}
                    </div>
                    <div className="col-span-1">
                      <StatusBadge tone={um.tone} dot={false}>{um.label}</StatusBadge>
                    </div>
                    <div className="col-span-2">
                      <StatusBadge tone={sm.tone}>{sm.label}</StatusBadge>
                    </div>
                    <div className="col-span-1 text-right text-xs text-muted-foreground tabular-nums">
                      {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </Link>
                );
              })}
              {rows.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No referrals match your filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}