import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Stethoscope, ClipboardList, Activity, Volume2, Loader2, StopCircle } from "lucide-react";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateSpeech } from "@/lib/healix/tts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/healix/ai")({
  head: () => ({
    meta: [
      { title: "AI Assistant — HEALIX AI" },
      { name: "description", content: "Clinical AI assistant for summaries, differentials and drafting." },
    ],
  }),
  component: AiPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const PRESETS = [
  { icon: Stethoscope, label: "Summarize the latest visit", prompt: "Summarize this patient's most recent encounter into a SOAP note." },
  { icon: ClipboardList, label: "Generate differential", prompt: "Given the vitals and conditions, suggest a differential diagnosis ranked by probability." },
  { icon: Activity, label: "Risk stratification", prompt: "Stratify the panel into low / medium / high risk with recommended next actions." },
];

function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm HEALIX AI. Ask me to summarize a chart, draft a SOAP note, or build a differential. I work over your FHIR data." },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    if (typeof window !== "undefined") {
      const key = "healix.ai.sessionId";
      const existing = window.localStorage.getItem(key);
      if (existing) sessionIdRef.current = existing;
      else {
        const id = (crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        window.localStorage.setItem(key, id);
        sessionIdRef.current = id;
      }
    } else {
      sessionIdRef.current = "ssr";
    }
  }
  const [authInfo, setAuthInfo] = useState<{ userId: string | null; userEmail: string | null }>({ userId: null, userEmail: null });
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthInfo({ userId: data.user?.id ?? null, userEmail: data.user?.email ?? null });
    });
  }, []);

  const speak = async (idx: number, text: string) => {
    if (speakingIdx === idx && currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setSpeakingIdx(null);
      return;
    }
    if (currentAudio) {
      currentAudio.pause();
    }
    setSpeakingIdx(idx);
    try {
      const blob = await generateSpeech(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        setSpeakingIdx((s) => (s === idx ? null : s));
        setCurrentAudio((a) => (a === audio ? null : a));
      });
      setCurrentAudio(audio);
      await audio.play();
    } catch (err) {
      toast.error((err as Error).message || "Couldn't generate speech");
      setSpeakingIdx(null);
    }
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/healix/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content }],
          sessionId: sessionIdRef.current,
          userId: authInfo.userId,
          userEmail: authInfo.userEmail,
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "(no response)" }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm offline right now. Please try again in a moment." },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <HealixShell title="AI Assistant" subtitle="Clinical reasoning over FHIR R4 data">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <Card className="xl:col-span-3 flex flex-col h-[70vh]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("max-w-[85%]", m.role === "user" ? "ml-auto" : "")}> 
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && (
                  <button
                    onClick={() => speak(i, m.content)}
                    className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {speakingIdx === i ? (
                      currentAudio ? (
                        <>
                          <StopCircle className="h-3.5 w-3.5" /> Stop
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                        </>
                      )
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" /> Listen
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
            {pending && (
              <div className="bg-muted rounded-2xl px-4 py-3 max-w-[60%] text-sm text-muted-foreground animate-pulse">
                HEALIX AI is thinking…
              </div>
            )}
          </CardContent>
          <div className="border-t border-border p-3 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a patient, draft a note, or request a differential…"
              className="min-h-[44px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={() => send()} disabled={pending} className="bg-gradient-primary text-primary-foreground self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">Quick prompts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PRESETS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => send(prompt)}
                  className="w-full text-left flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:border-primary/40 hover:bg-accent/40 transition-colors"
                >
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">{prompt}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-gradient-surface border-primary/30">
            <CardContent className="p-4 text-xs text-muted-foreground">
              <div className="text-foreground font-medium text-sm mb-1">Privacy & compliance</div>
              All AI requests are processed via the Lovable AI Gateway. No patient data leaves your tenant boundary; PHI is redacted before transit per the HIPAA configuration.
            </CardContent>
          </Card>
        </div>
      </div>
    </HealixShell>
  );
}