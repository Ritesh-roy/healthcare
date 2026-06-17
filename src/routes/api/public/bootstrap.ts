import { createFileRoute } from "@tanstack/react-router";

// Idempotent bootstrap endpoint.
// POST /api/public/bootstrap            -> seeds 10 demo doctors if none exist
// POST /api/public/bootstrap { email }  -> ALSO grants admin role to that user_id
//                                         if their email is listed in ADMIN_EMAILS

const DEMO_DOCTORS = [
  { name: "Rahul Sharma",   first: "Rahul",   specialty: "Cardiology" },
  { name: "Amit Kumar",     first: "Amit",    specialty: "Endocrinology" },
  { name: "Vikram Singh",   first: "Vikram",  specialty: "Neurology" },
  { name: "Neha Gupta",     first: "Neha",    specialty: "Gastroenterology" },
  { name: "Priya Verma",    first: "Priya",   specialty: "Dermatology" },
  { name: "Arjun Mehta",    first: "Arjun",   specialty: "Orthopaedics" },
  { name: "Riya Kapoor",    first: "Riya",    specialty: "ENT" },
  { name: "Ankit Jain",     first: "Ankit",   specialty: "Ophthalmology" },
  { name: "Pooja Sharma",   first: "Pooja",   specialty: "Psychiatry" },
  { name: "Karan Malhotra", first: "Karan",   specialty: "Rheumatology" },
];

function doctorEmail(first: string) {
  return `${first.toLowerCase()}@leo.demo`;
}
function doctorPassword(first: string) {
  return `${first}@leo`;
}

export const Route = createFileRoute("/api/public/bootstrap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let body: { email?: string } = {};
        try { body = await request.json(); } catch { /* empty body OK */ }

        const result: Record<string, unknown> = {};

        // 1. Seed doctors if table empty
        const { count: existingCount, error: countErr } = await supabaseAdmin
          .from("doctors")
          .select("id", { count: "exact", head: true });
        if (countErr) {
          return Response.json({ error: `count doctors: ${countErr.message}` }, { status: 500 });
        }

        if ((existingCount ?? 0) === 0) {
          const created: { name: string; email: string; password: string }[] = [];
          for (const d of DEMO_DOCTORS) {
            const email = doctorEmail(d.first);
            const password = doctorPassword(d.first);

            // Create auth user (idempotent: if exists, fetch id)
            let userId: string | null = null;
            const { data: createRes, error: createErr } =
              await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: d.name, role: "doctor" },
              });
            if (createErr) {
              // try to find existing user
              const { data: list } = await supabaseAdmin.auth.admin.listUsers();
              const found = list?.users?.find((u) => u.email === email);
              userId = found?.id ?? null;
            } else {
              userId = createRes.user?.id ?? null;
            }

            // Insert doctor row
            const { error: docErr } = await supabaseAdmin.from("doctors").insert({
              user_id: userId,
              name: `Dr. ${d.name}`,
              email,
              specialty: d.specialty,
              status: "active",
            });
            if (docErr) {
              return Response.json(
                { error: `insert doctor ${d.name}: ${docErr.message}` },
                { status: 500 },
              );
            }

            // Grant doctor role
            if (userId) {
              await supabaseAdmin
                .from("user_roles")
                .insert({ user_id: userId, role: "doctor" })
                .select();
            }

            created.push({ name: d.name, email, password });
          }
          result.seeded_doctors = created;
        } else {
          result.seeded_doctors = `skipped (${existingCount} doctors already exist)`;
        }

        // 2. Grant admin role if email matches ADMIN_EMAILS
        if (body.email) {
          const admins = (process.env.ADMIN_EMAILS ?? "")
            .split(/[,\s]+/)
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          const target = body.email.trim().toLowerCase();
          if (!admins.includes(target)) {
            result.admin_grant = `email ${target} not in ADMIN_EMAILS allowlist`;
          } else {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers();
            const user = list?.users?.find((u) => u.email?.toLowerCase() === target);
            if (!user) {
              result.admin_grant = `user ${target} not found — sign up first`;
            } else {
              const { error: roleErr } = await supabaseAdmin
                .from("user_roles")
                .upsert(
                  { user_id: user.id, role: "admin" },
                  { onConflict: "user_id,role", ignoreDuplicates: true },
                );
              result.admin_grant = roleErr
                ? `failed: ${roleErr.message}`
                : `admin role granted to ${target}`;
            }
          }
        }

        return Response.json({ ok: true, ...result });
      },
    },
  },
});