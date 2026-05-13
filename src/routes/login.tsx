import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Loader2, Mail, Lock, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DEFAULT_USER, getStoredUser, setStoredUser, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Refera" },
      { name: "description", content: "Sign in to Refera, the clinician-first FHIR referral platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  // sign in
  const [email, setEmail] = useState("eleanor.voss@riverside.health");
  const [password, setPassword] = useState("demo");

  // sign up
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [role, setRole] = useState<AuthUser["role"]>("GP");
  const [org, setOrg] = useState("");

  useEffect(() => {
    if (getStoredUser()) navigate({ to: "/" });
  }, [navigate]);

  const finish = (u: AuthUser, msg: string) => {
    setLoading(true);
    setTimeout(() => {
      setStoredUser(u);
      toast.success(msg, { description: `Welcome, ${u.name}.` });
      navigate({ to: "/" });
    }, 450);
  };

  const onSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    finish({ ...DEFAULT_USER, email }, "Signed in");
  };

  const onSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !signupEmail || !signupPassword || !org) {
      toast.error("Please complete every field.");
      return;
    }
    finish({ name, email: signupEmail, role, organization: org }, "Account created");
  };

  const useDemo = () => finish(DEFAULT_USER, "Signed in as demo clinician");

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      {/* Brand panel */}
      <div className="hidden lg:flex relative overflow-hidden border-r border-border">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "var(--gradient-surface)" }}
        />
        <div
          className="absolute -top-32 -left-24 h-96 w-96 rounded-full blur-3xl opacity-40"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div
          className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-30"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/login" className="inline-flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">Refera</div>
              <div className="text-[11px] text-muted-foreground">Clinical referrals</div>
            </div>
          </Link>

          <div className="max-w-md space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              The simplest, safest GP&nbsp;→&nbsp;Specialist referral flow.
            </h1>
            <p className="text-sm text-muted-foreground">
              Built on FHIR R4. Designed for clinicians who care about clarity, speed,
              and closing the loop on every patient.
            </p>
            <div className="space-y-3 text-sm">
              <Feature icon={ShieldCheck} title="HIPAA-aligned audit trail" desc="Every action signed, timestamped, and traceable." />
              <Feature icon={Stethoscope} title="Clinician-first triage" desc="Accept, schedule, and consult in two clicks." />
              <Feature icon={Activity} title="Closed-loop reporting" desc="Outcomes return to the referring GP automatically." />
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Refera Health · Demo environment
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="glass-panel border-border/60 w-full max-w-md">
          <CardContent className="p-7 space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with your clinician account to continue.
              </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form onSubmit={onSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" autoComplete="email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => toast.message("Password reset link sent (demo).")}>
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="current-password" />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={useDemo} disabled={loading}>
                    Continue with demo account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={onSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Work email</Label>
                    <Input id="su-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="jane.doe@clinic.health" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={role} onValueChange={(v) => setRole(v as AuthUser["role"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GP">GP</SelectItem>
                          <SelectItem value="Specialist">Specialist</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org">Organisation</Label>
                      <Input id="org" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Clinic name" />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-[11px] text-muted-foreground text-center">
              By continuing you agree to our Terms and acknowledge the Privacy Notice.
              Demo data only — no real PHI is stored.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary grid place-items-center">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}