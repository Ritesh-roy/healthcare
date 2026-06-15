import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/healix/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        let body: { messages?: { role: string; content: string }[] } = {};
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = body.messages ?? [];

        if (!apiKey) {
          // Graceful offline fallback so the UI keeps working in mock mode.
          const last = messages.at(-1)?.content ?? "";
          return Response.json({
            reply:
              "AI Gateway is not configured for this environment yet. " +
              "Connect Lovable AI from Settings to enable live clinical reasoning. " +
              (last ? `\n\nYou asked: "${last.slice(0, 200)}"` : ""),
          });
        }

        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content:
                    "You are HEALIX AI, a clinical reasoning assistant for licensed clinicians. " +
                    "Be concise, evidence-based, and always remind that you are an AI assistant — not a substitute for clinical judgement. " +
                    "Format responses with short paragraphs and bullet lists where appropriate.",
                },
                ...messages,
              ],
            }),
          });
          if (!upstream.ok) {
            const text = await upstream.text();
            return Response.json({ reply: `AI Gateway error (${upstream.status}): ${text.slice(0, 200)}` }, { status: 200 });
          }
          const data = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
          const reply = data.choices?.[0]?.message?.content ?? "(empty response)";
          return Response.json({ reply });
        } catch (err) {
          return Response.json({ reply: `AI request failed: ${(err as Error).message}` });
        }
      },
    },
  },
});