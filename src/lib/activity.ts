import { supabase } from "@/integrations/supabase/client";
import { getStoredUser } from "@/lib/auth";

const SESSION_KEY = "refera.activity.session";
const DB_SESSION_KEY = "refera.activity.dbSession";

export function getActivitySessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let s = window.sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      window.sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "anon";
  }
}

export function resetActivitySession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(DB_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export type ActivityEvent = "login" | "logout" | "navigate" | "action";

export async function logActivity(
  event_type: ActivityEvent,
  payload: { action?: string; route?: string; metadata?: Record<string, unknown> } = {},
  userOverride?: { name: string; email: string; role: string } | null,
) {
  if (typeof window === "undefined") return;
  const u = userOverride ?? getStoredUser();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const authUserId = auth.user?.id ?? null;
    await supabase.from("user_activity").insert({
      user_id: authUserId,
      user_email: u?.email ?? null,
      user_name: u?.name ?? null,
      user_role: u?.role ?? null,
      event_type,
      action: payload.action ?? null,
      route: payload.route ?? window.location.pathname,
      metadata: (payload.metadata ?? null) as never,
      session_id: getActivitySessionId(),
      user_agent: window.navigator.userAgent,
    });
  } catch {
    /* swallow — logging must never break UX */
  }
}

export async function startUserSession(userEmail: string | null) {
  if (typeof window === "undefined") return;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: row, error } = await supabase
      .from("user_sessions")
      .insert({
        user_id: data.user.id,
        user_email: userEmail ?? data.user.email ?? null,
        user_agent: window.navigator.userAgent,
      })
      .select("id")
      .single();
    if (!error && row?.id) window.sessionStorage.setItem(DB_SESSION_KEY, row.id);
  } catch {
    /* ignore */
  }
}

export async function finishUserSession() {
  if (typeof window === "undefined") return;
  try {
    const sessionId = window.sessionStorage.getItem(DB_SESSION_KEY);
    if (!sessionId) return;
    await supabase
      .from("user_sessions")
      .update({ logout_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
      .eq("id", sessionId);
    window.sessionStorage.removeItem(DB_SESSION_KEY);
  } catch {
    /* ignore */
  }
}