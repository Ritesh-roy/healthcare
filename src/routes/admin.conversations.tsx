import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, Search, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listConversations, type AdminConversation } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { setStoredUser } from "@/lib/auth";

export const Route = createFileRoute("/admin/conversations")({
  head: () => ({ meta: [{ title: "AI Conversations — Admin" }] }),
  component: AdminConversationsPage,
});

function AdminConversationsPage() {
  const [rows, setRows] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setError("NoSession");
        return;
      }
      const data = await listConversations();
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.user_email, r.user_id, r.session_id, r.user_message, r.ai_response]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [rows, q]);

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
            <p>
              Please sign in again with your admin email and password so we can
              load the AI conversation logs.
            </p>
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user, email, session, message…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} of {rows.length}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All AI conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Timestamp</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Session</th>
                    <th className="text-left p-3">User message</th>
                    <th className="text-left p-3">AI response</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No conversations yet.</td></tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border align-top">
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 max-w-[180px]">
                          <div className="font-medium truncate">{r.user_email ?? "Anonymous"}</div>
                          <div className="text-[11px] text-muted-foreground font-mono truncate">{r.user_id ?? "—"}</div>
                        </td>
                        <td className="p-3 text-[11px] font-mono text-muted-foreground max-w-[140px] truncate">{r.session_id}</td>
                        <td className="p-3 max-w-md whitespace-pre-wrap break-words">{r.user_message}</td>
                        <td className="p-3 max-w-lg whitespace-pre-wrap break-words text-muted-foreground">{r.ai_response}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {error && error !== "Forbidden" && error !== "Unauthorized" && (
          <div className="text-sm text-destructive">{error}</div>
        )}
      </div>
    </AppShell>
  );
}