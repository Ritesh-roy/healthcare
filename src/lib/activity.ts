import { supabase } from "@/integrations/supabase/client";
import { getStoredUser } from "@/lib/auth";

const SESSION_KEY = "refera.activity.session";

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
    await supabase.from("user_activity").insert({
      user_id: null,
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