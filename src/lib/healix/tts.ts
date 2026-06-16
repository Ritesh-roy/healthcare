// Reusable client-side helper. Calls our server proxy which holds RAPIDAPI_KEY.
export async function generateSpeech(
  text: string,
  options?: { voice?: string; instructions?: string; model?: string },
): Promise<Blob> {
  const res = await fetch("/api/healix/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice: options?.voice ?? "alloy",
      instructions:
        options?.instructions ??
        "Speak in a calm, professional medical assistant voice.",
      model: options?.model ?? "tts-1",
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `TTS failed (${res.status})`);
  }
  return res.blob();
}

export async function playSpeech(
  text: string,
  options?: { voice?: string; instructions?: string; model?: string },
): Promise<HTMLAudioElement> {
  const blob = await generateSpeech(text, options);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  await audio.play();
  return audio;
}