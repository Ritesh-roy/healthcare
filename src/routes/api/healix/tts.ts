import { createFileRoute } from "@tanstack/react-router";

type TtsBody = {
  text?: string;
  voice?: string;
  instructions?: string;
  model?: string;
};

export const Route = createFileRoute("/api/healix/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.RAPIDAPI_KEY;
        if (!apiKey) {
          return new Response("RAPIDAPI_KEY is not configured", { status: 500 });
        }

        let body: TtsBody = {};
        try {
          body = (await request.json()) as TtsBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const text = (body.text ?? "").trim();
        if (!text) return new Response("Missing 'text'", { status: 400 });

        try {
          const upstream = await fetch(
            "https://open-ai-text-to-speech1.p.rapidapi.com/",
            {
              method: "POST",
              headers: {
                "X-RapidAPI-Key": apiKey,
                "X-RapidAPI-Host": "open-ai-text-to-speech1.p.rapidapi.com",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: body.model ?? "tts-1",
                input: text,
                instructions:
                  body.instructions ??
                  "Speak in a calm, professional medical assistant voice.",
                voice: body.voice ?? "alloy",
              }),
            },
          );

          if (!upstream.ok) {
            const msg = await upstream.text();
            return new Response(
              `TTS upstream error (${upstream.status}): ${msg.slice(0, 300)}`,
              { status: 502 },
            );
          }

          const audio = await upstream.arrayBuffer();
          return new Response(audio, {
            status: 200,
            headers: {
              "Content-Type":
                upstream.headers.get("content-type") ?? "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          return new Response(
            `TTS request failed: ${(err as Error).message}`,
            { status: 500 },
          );
        }
      },
    },
  },
});