import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminConversation = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  session_id: string;
  user_message: string;
  ai_response: string;
  created_at: string;
};

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminConversation[]> => {
    const email = (context.claims as { email?: string } | undefined)?.email ?? null;
    if (!isAdmin(email)) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("healix_conversations")
      .select("id, user_id, user_email, session_id, user_message, ai_response, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminConversation[];
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; email: string | null }> => {
    const email = (context.claims as { email?: string } | undefined)?.email ?? null;
    return { isAdmin: isAdmin(email), email };
  });