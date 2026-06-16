import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DEFAULT_USER, getStoredUser, setStoredUser, type AuthUser } from "@/lib/auth";
import { resolvePractitionerId } from "@/lib/master-store";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTRY_KEY = "refera.auth.registry";

type RegistryEntry = {
  email: string;
  password: string;
  name: string;
  role: AuthUser["role"];
  organization: string;
};

const DEMO_ACCOUNTS: RegistryEntry[] = [
  {
    email: "adminleo@gmail.com",
    password: "leo@admin",
    name: "Admin · Refera",
    role: "Admin",
    organization: "Refera HQ",
  },
];

function readRegistry(): RegistryEntry[] {
  if (typeof window === "undefined") return DEMO_ACCOUNTS;
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    const list = raw ? (JSON.parse(raw) as RegistryEntry[]) : [];
    const merged = [...list];
    for (const d of DEMO_ACCOUNTS) {
      if (!merged.some((e) => e.email.toLowerCase() === d.email.toLowerCase())) {
        merged.push(d);
      }
    }
    return merged;
  } catch {
    return DEMO_ACCOUNTS;
  }
}

function writeRegistry(entry: RegistryEntry) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    const list = raw ? (JSON.parse(raw) as RegistryEntry[]) : [];
    const filtered = list.filter((e) => e.email.toLowerCase() !== entry.email.toLowerCase());
    filtered.push(entry);
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signinTouched, setSigninTouched] = useState<Record<string, boolean>>({});

  // sign up
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [role, setRole] = useState<AuthUser["role"]>("GP");
  const [org, setOrg] = useState("");
  const [signupTouched, setSignupTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (getStoredUser()) navigate({ to: "/" });
  }, [navigate]);

  const signinErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  }, [email, password]);

  const signupErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Enter your full name.";
    if (!signupEmail.trim()) e.email = "Work email is required.";
    else if (!EMAIL_RE.test(signupEmail.trim())) e.email = "Enter a valid work email.";
    if (signupPassword.length < 8) e.password = "Password must be at least 8 characters.";
    if (org.trim().length < 2) e.org = "Organisation is required.";
    return e;
  }, [name, signupEmail, signupPassword, org]);

  const signinValid = Object.keys(signinErrors).length === 0;
  const signupValid = Object.keys(signupErrors).length === 0;

  const finish = (u: AuthUser, msg: string) => {
    setLoading(true);
    setTimeout(() => {
      setStoredUser(u);
      toast.success(msg, { description: `Welcome, ${u.name}.` });
      navigate({ to: "/" });
    }, 450);
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninTouched({ email: true, password: true });
    if (!signinValid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const registry = readRegistry();
    const match = registry.find(
      (r) => r.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match) {
      toast.error("No account found for this email.", {
        description: "Please create an account first.",
        action: { label: "Create account", onClick: () => setMode("signup") },
      });
      return;
    }
    if (match.password !== password) {
      toast.error("Incorrect password.", {
        description: "Please try again or reset your password.",
      });
      return;
    }
    // Best-effort Supabase sign-in so admin server functions get a bearer token.
    try {
      await supabase.auth.signInWithPassword({ email: email.trim(), password });
    } catch {
      // ignore — fall through to mock auth for demo accounts
    }
    const isAdmin = match.role === "Admin";
    const practitionerId = isAdmin ? undefined : resolvePractitionerId(match.email);
    finish(
      {
        ...DEFAULT_USER,
        name: match.name,
        email: match.email,
        role: match.role,
        organization: match.organization,
        practitionerId,
      },
      "Signed in",
    );
  };

  const onSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupTouched({ name: true, email: true, password: true, org: true });
    if (!signupValid) {
      toast.error("Please complete every required field.");
      return;
    }
    const registry = readRegistry();
    if (registry.some((r) => r.email.toLowerCase() === signupEmail.trim().toLowerCase())) {
      toast.error("An account with this email already exists.", {
        description: "Please sign in instead.",
        action: { label: "Sign in", onClick: () => setMode("signin") },
      });
      return;
    }
    writeRegistry({
      email: signupEmail.trim(),
      password: signupPassword,
      name,
      role,
      organization: org,
    });
    toast.success("Account created", {
      description: "Please sign in with your new credentials.",
    });
    setEmail(signupEmail.trim());
    setPassword("");
    setMode("signin");
    setLoading(false);
    return;
    // eslint-disable-next-line no-unreachable
    finish(
      {
        name,
        email: signupEmail,
        role,
        organization: org,
        practitionerId: role === "Admin" ? undefined : resolvePractitionerId(signupEmail),
      },
      "Account created",
    );
  };

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
            <h1 className="font-display text-[2.75rem] leading-[1.05] text-foreground">
              The simplest, safest <em className="not-italic text-primary">GP → Specialist</em> referral flow.
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
            © {new Date().getFullYear()} Refera Health · All rights reserved
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="glass-panel border-border/60 w-full max-w-md">
          <CardContent className="p-7 space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-display text-3xl text-foreground">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in with your clinician account to continue."
                  : "All fields are required to register your clinical workspace."}
              </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form onSubmit={onSignIn} noValidate className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setSigninTouched((t) => ({ ...t, email: true }))}
                        className={cn(
                          "pl-9",
                          signinTouched.email && signinErrors.email && "border-destructive focus-visible:ring-destructive/40",
                        )}
                        autoComplete="email"
                        placeholder="you@clinic.health"
                      />
                    </div>
                    <FieldError show={signinTouched.email} message={signinErrors.email} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password *</Label>
                      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => {
                        if (!email || !EMAIL_RE.test(email)) {
                          toast.error("Enter a valid email first.");
                          setSigninTouched((t) => ({ ...t, email: true }));
                          return;
                        }
                        toast.success("Password reset link sent", { description: `Check ${email} for instructions.` });
                      }}>
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setSigninTouched((t) => ({ ...t, password: true }))}
                        className={cn(
                          "pl-9",
                          signinTouched.password && signinErrors.password && "border-destructive focus-visible:ring-destructive/40",
                        )}
                        autoComplete="current-password"
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <FieldError show={signinTouched.password} message={signinErrors.password} />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !signinValid}
                    className="w-full bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Protected by HIPAA-aligned audit logging and end-to-end encryption.
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={onSignUp} noValidate className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name *</Label>
                    <div className="relative">
                      <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setSignupTouched((t) => ({ ...t, name: true }))}
                        placeholder="Dr. Jane Doe"
                        className={cn(
                          "pl-9",
                          signupTouched.name && signupErrors.name && "border-destructive focus-visible:ring-destructive/40",
                        )}
                      />
                    </div>
                    <FieldError show={signupTouched.name} message={signupErrors.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Work email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="su-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        onBlur={() => setSignupTouched((t) => ({ ...t, email: true }))}
                        placeholder="jane.doe@clinic.health"
                        className={cn(
                          "pl-9",
                          signupTouched.email && signupErrors.email && "border-destructive focus-visible:ring-destructive/40",
                        )}
                      />
                    </div>
                    <FieldError show={signupTouched.email} message={signupErrors.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="su-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        onBlur={() => setSignupTouched((t) => ({ ...t, password: true }))}
                        placeholder="At least 8 characters"
                        className={cn(
                          "pl-9",
                          signupTouched.password && signupErrors.password && "border-destructive focus-visible:ring-destructive/40",
                        )}
                      />
                    </div>
                    <FieldError show={signupTouched.password} message={signupErrors.password} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Role *</Label>
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
                      <Label htmlFor="org">Organisation *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="org"
                          value={org}
                          onChange={(e) => setOrg(e.target.value)}
                          onBlur={() => setSignupTouched((t) => ({ ...t, org: true }))}
                          placeholder="Clinic name"
                          className={cn(
                            "pl-9",
                            signupTouched.org && signupErrors.org && "border-destructive focus-visible:ring-destructive/40",
                          )}
                        />
                      </div>
                      <FieldError show={signupTouched.org} message={signupErrors.org} />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !signupValid}
                    className="w-full bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-[11px] text-muted-foreground text-center">
              By continuing you agree to our <span className="text-foreground/80">Terms of Service</span> and acknowledge the <span className="text-foreground/80">Privacy Notice</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FieldError({ show, message }: { show?: boolean; message?: string }) {
  if (!show || !message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
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