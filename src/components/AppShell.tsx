import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  CalendarDays,
  FileText,
  Plus,
  Search,
  Bell,
  Settings,
  Activity,
  ChevronRight,
  LogOut,
  UserCircle2,
  HelpCircle,
  Sun,
  Moon,
  ShieldCheck,
  Keyboard,
  Building2,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, DEFAULT_USER, setStoredUser, type AuthUser } from "@/lib/auth";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, hint: "Overview" },
  { to: "/referrals", label: "Referrals", icon: Inbox, hint: "Triage queue" },
  { to: "/patients", label: "Patients", icon: Users, hint: "Active panel" },
  { to: "/appointments", label: "Appointments", icon: CalendarDays, hint: "Calendar" },
  { to: "/consultations", label: "Consultations", icon: FileText, hint: "Outcomes" },
] as const;

const NOTIFICATIONS = [
  { id: 1, icon: AlertTriangle, tone: "warn" as const, title: "Urgent referral awaiting triage", body: "Amelia Hartwell · Endocrinology · HbA1c 9.2%", time: "8m" },
  { id: 2, icon: CheckCheck, tone: "success" as const, title: "Consult completed", body: "Jonas Albrecht · Cardiology pre-op cleared", time: "2h" },
  { id: 3, icon: CalendarDays, tone: "info" as const, title: "Appointment scheduled", body: "Marcus Doyle · St. Aldwyn · 14 May 09:15", time: "1d" },
];

function useTitleFromPath(pathname: string) {
  return useMemo(() => {
    if (pathname === "/") return { title: "Dashboard", crumbs: ["Workspace", "Dashboard"] };
    if (pathname.startsWith("/referrals/new")) return { title: "New referral", crumbs: ["Workspace", "Referrals", "New"] };
    if (pathname.startsWith("/referrals/")) return { title: "Referral detail", crumbs: ["Workspace", "Referrals", "Detail"] };
    if (pathname.startsWith("/referrals")) return { title: "Referrals", crumbs: ["Workspace", "Referrals"] };
    if (pathname.startsWith("/patients")) return { title: "Patients", crumbs: ["Workspace", "Patients"] };
    if (pathname.startsWith("/appointments")) return { title: "Appointments", crumbs: ["Workspace", "Appointments"] };
    if (pathname.startsWith("/consultations")) return { title: "Consultations", crumbs: ["Workspace", "Consultations"] };
    return { title: "Refera", crumbs: ["Workspace"] };
  }, [pathname]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);

  // Auth guard — redirect unauthenticated users to /login
  useEffect(() => {
    if (ready && !user && location.pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [ready, user, location.pathname, navigate]);

  // Theme toggle (root <html> already uses .dark)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const active: AuthUser = user ?? DEFAULT_USER;
  const initials = active.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const { title, crumbs } = useTitleFromPath(location.pathname);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate({ to: "/referrals" });
    toast.message(`Searching "${search}"`, { description: "Filter applied to referrals." });
  };

  const onLogout = () => {
    setStoredUser(null);
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Refera</div>
            <div className="text-[11px] text-muted-foreground">Clinical referrals</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          {nav.map((item) => {
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-elegant"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] text-muted-foreground/70 font-normal">{item.hint}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Organisation</span>
            </div>
            <div className="text-sm font-medium leading-tight">{active.organization}</div>
            <div className="text-[11px] text-muted-foreground">FHIR R4 endpoint healthy</div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
          {/* Row 1 — utility bar */}
          <div className="flex items-center gap-3 px-6 h-14">
            <form onSubmit={submitSearch} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients, referrals, specialists…"
                className="pl-9 pr-14 h-9 bg-input/60 border-border"
              />
              <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </form>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[oklch(var(--status-danger))]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 glass-panel border-border/60">
                <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                  <div className="text-sm font-semibold">Notifications</div>
                  <button
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => toast.success("All notifications marked as read")}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-auto">
                  {NOTIFICATIONS.map((n) => {
                    const Icon = n.icon;
                    const tone =
                      n.tone === "warn"
                        ? "text-[oklch(var(--status-warn))] bg-[var(--status-warn-bg)]"
                        : n.tone === "success"
                          ? "text-[oklch(var(--status-success))] bg-[var(--status-success-bg)]"
                          : "text-[oklch(var(--status-info))] bg-[var(--status-info-bg)]";
                    return (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                        <div className={cn("h-7 w-7 rounded-md grid place-items-center shrink-0", tone)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-snug">{n.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums shrink-0">{n.time}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2 border-t border-border">
                  <Link to="/referrals" className="text-xs text-primary hover:underline">
                    View all activity →
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Workspace settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.message("Preferences (demo)")}>
                  <UserCircle2 className="h-4 w-4 mr-2" /> Profile preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message("Security & audit (demo)")}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Security & audit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message("Keyboard shortcuts (demo)")}>
                  <Keyboard className="h-4 w-4 mr-2" /> Keyboard shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.message("Help center (demo)")}>
                  <HelpCircle className="h-4 w-4 mr-2" /> Help & support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/referrals/new">
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-glow gap-1.5">
                <Plus className="h-4 w-4" /> New referral
              </Button>
            </Link>

            <Separator orientation="vertical" className="h-7 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg pl-1 pr-2 py-1 hover:bg-accent/60 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-accent grid place-items-center text-xs font-semibold text-accent-foreground">
                    {initials}
                  </div>
                  <div className="hidden lg:block leading-tight text-left">
                    <div className="text-xs font-medium truncate max-w-[140px]">{active.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{active.role} · {active.organization}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{active.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">{active.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.message("Profile (demo)")}>
                  <UserCircle2 className="h-4 w-4 mr-2" /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message("Notification settings (demo)")}>
                  <Bell className="h-4 w-4 mr-2" /> Notification settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-[oklch(var(--status-danger))] focus:text-[oklch(var(--status-danger))]">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2 — context bar with breadcrumbs */}
          <div className="flex items-center gap-2 px-6 h-10 border-t border-border/60 bg-background/40">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
                  <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>{c}</span>
                </span>
              ))}
            </nav>
            <Separator orientation="vertical" className="h-4 mx-2" />
            <div className="text-xs text-muted-foreground hidden md:block">
              {title} · signed in as <span className="text-foreground/80">{active.role}</span>
            </div>
            <div className="flex-1" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(var(--status-success))]" />
              All systems operational
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}