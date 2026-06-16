import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT =
  "You are HEALIX AI, a clinical reasoning assistant for licensed clinicians. " +
  "Be concise, evidence-based, and always remind that you are an AI assistant — not a substitute for clinical judgement. " +
  "Format responses with short paragraphs and bullet lists where appropriate.";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

async function callGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    encodeURIComponent(apiKey);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "(empty response)"
  );
}

export const Route = createFileRoute("/api/healix/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.GEMINI_API_KEY;
        let body: {
          messages?: ChatMessage[];
          sessionId?: string;
          userId?: string | null;
          userEmail?: string | null;
        } = {};
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = body.messages ?? [];
        const sessionId = body.sessionId || "anonymous";
        const userMessage =
          [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

        if (!apiKey) {
          return Response.json(
            { reply: "GEMINI_API_KEY is not configured on the server." },
            { status: 500 },
          );
        }

        try {
          const reply = await callGemini(apiKey, messages);

          // Persist conversation. Failures here must not break the chat.
          try {
            const { supabaseAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            await supabaseAdmin.from("healix_conversations").insert({
              user_id: body.userId ?? null,
              user_email: body.userEmail ?? null,
              session_id: sessionId,
              user_message: userMessage,
              ai_response: reply,
            });
          } catch (logErr) {
            console.error("healix_conversations insert failed", logErr);
          }

          return Response.json({ reply });
        } catch (err) {
          return Response.json({
            reply: `AI request failed: ${(err as Error).message}`,
          });
        }
      },
    },
  },
});