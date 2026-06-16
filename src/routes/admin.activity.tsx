import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, Search, RefreshCw, LogIn, LogOut, MousePointerClick, Navigation } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listActivity, type AdminActivity } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { setStoredUser } from "@/lib/auth";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({ meta: [{ title: "User Activity — Admin" }] }),
  component: AdminActivityPage,
});

type SessionSummary = {
  session_id: string;
  user_email: string | null;
  user_name: string | null;
  user_role: string | null;
  login_at: string | null;
  logout_at: string | null;
  duration_ms: number | null;
  event_count: number;
  routes: string[];
  actions: AdminActivity[];
};

function summarize(rows: AdminActivity[]): SessionSummary[] {
  const byId = new Map<string, AdminActivity[]>();
  for (const r of rows) {
    const key = r.session_id || `nosession-${r.user_email ?? "anon"}`;
    if (!byId.has(key)) byId.set(key, []);
    byId.get(key)!.push(r);
  }
  const out: SessionSummary[] = [];
  for (const [sid, items] of byId.entries()) {
    const sorted = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const login = sorted.find((r) => r.event_type === "login");
    const logout = [...sorted].reverse().find((r) => r.event_type === "logout");
    const ref = login ?? sorted[0];
    out.push({
      session_id: sid,
      user_email: ref.user_email,
      user_name: ref.user_name,
      user_role: ref.user_role,
      login_at: login?.created_at ?? null,
      logout_at: logout?.created_at ?? null,
      duration_ms:
        login && logout ? new Date(logout.created_at).getTime() - new Date(login.created_at).getTime() : null,
      event_count: sorted.length,
      routes: Array.from(new Set(sorted.map((r) => r.route ?? "").filter(Boolean))),
      actions: sorted,
    });
  }
  return out.sort((a, b) => (b.login_at ?? "").localeCompare(a.login_at ?? ""));
}

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}
function dur(ms: number | null) {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function eventIcon(t: string) {
  if (t === "login") return <LogIn className="h-3.5 w-3.5" />;
  if (t === "logout") return <LogOut className="h-3.5 w-3.5" />;
  if (t === "action") return <MousePointerClick className="h-3.5 w-3.5" />;
  return <Navigation className="h-3.5 w-3.5" />;
}

function AdminActivityPage() {
  const [rows, setRows] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setError("NoSession");
        return;
      }
      const data = await listActivity();
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (eventFilter !== "all" && r.event_type !== eventFilter) return false;
      if (!term) return true;
      return [r.user_email, r.user_name, r.user_role, r.route, r.action, r.session_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [rows, q, eventFilter]);

  const sessions = useMemo(() => summarize(filteredRows), [filteredRows]);

  if (error === "NoSession" || error?.includes("Unauthorized") || error === "Forbidden") {
    return (
      <AppShell>
        <Card className="max-w-xl mx-auto mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Admin sign-in required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Sign in again with your admin email and password to view activity logs.</p>
            <Button
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut().catch(() => {});
                setStoredUser(null);
                window.location.href = "/login";
              }}
            >
              Sign in again
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold">User Activity</h1>
            <p className="text-sm text-muted-foreground">
              Logins, logouts, navigation, and in-app actions. {rows.length} events.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by email, name, route, action, session…"
              className="pl-9"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="login">Logins</SelectItem>
              <SelectItem value="logout">Logouts</SelectItem>
              <SelectItem value="navigate">Navigation</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/conversations">AI Conversations →</Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : sessions.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No activity yet.</CardContent></Card>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">Sessions ({sessions.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {sessions.map((s) => {
                  const open = expanded === s.session_id;
                  return (
                    <div key={s.session_id} className="p-3">
                      <button
                        className="w-full text-left grid grid-cols-1 md:grid-cols-6 gap-2 items-center"
                        onClick={() => setExpanded(open ? null : s.session_id)}
                      >
                        <div className="md:col-span-2">
                          <div className="font-medium text-sm">{s.user_name ?? s.user_email ?? "Anonymous"}</div>
                          <div className="text-xs text-muted-foreground">{s.user_email ?? "—"}</div>
                        </div>
                        <div className="text-xs"><Badge variant="secondary">{s.user_role ?? "—"}</Badge></div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Login</div>
                          <div>{fmt(s.login_at)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Logout</div>
                          <div>{fmt(s.logout_at)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Duration · Events</div>
                          <div>{dur(s.duration_ms)} · {s.event_count}</div>
                        </div>
                      </button>
                      {open && (
                        <div className="mt-3 border-t pt-3 space-y-1.5">
                          <div className="text-xs text-muted-foreground mb-1">
                            Session: <span className="font-mono">{s.session_id}</span>
                          </div>
                          {s.actions.map((a) => (
                            <div key={a.id} className="flex items-start gap-2 text-xs">
                              <span className="mt-0.5 text-muted-foreground">{eventIcon(a.event_type)}</span>
                              <span className="w-36 shrink-0 text-muted-foreground">{fmt(a.created_at)}</span>
                              <Badge variant="outline" className="capitalize">{a.event_type}</Badge>
                              <span className="font-mono text-muted-foreground">{a.route ?? "—"}</span>
                              {a.action && <span>· {a.action}</span>}
                              {a.metadata && <span className="text-muted-foreground truncate">· {a.metadata}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}