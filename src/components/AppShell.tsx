import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Menu,
  ShieldAlert,
  Database,
  Hospital,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, DEFAULT_USER, setStoredUser, type AuthUser } from "@/lib/auth";
import { toast } from "sonner";
import { finishUserSession, logActivity, resetActivitySession } from "@/lib/activity";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTables } from "@/lib/realtime";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, hint: "Overview" },
  { to: "/referrals", label: "Referrals", icon: Inbox, hint: "Triage queue" },
  { to: "/patients", label: "Patients", icon: Users, hint: "Active panel" },
  { to: "/appointments", label: "Appointments", icon: CalendarDays, hint: "Calendar" },
  { to: "/hospitals", label: "Hospitals", icon: Hospital, hint: "Chest hospitals" },
  { to: "/consultations", label: "Consultations", icon: FileText, hint: "Outcomes" },
  { to: "/admin", label: "Admin", icon: ShieldAlert, hint: "All data", adminOnly: true },
  { to: "/masters", label: "Masters", icon: Database, hint: "Users, Roles, Depts", adminOnly: true },
] as const;

function useTitleFromPath(pathname: string) {
  return useMemo(() => {
    if (pathname === "/") return { title: "Dashboard", crumbs: ["Workspace", "Dashboard"] };
    if (pathname.startsWith("/referrals/new")) return { title: "New referral", crumbs: ["Workspace", "Referrals", "New"] };
    if (pathname.startsWith("/referrals/")) return { title: "Referral detail", crumbs: ["Workspace", "Referrals", "Detail"] };
    if (pathname.startsWith("/referrals")) return { title: "Referrals", crumbs: ["Workspace", "Referrals"] };
    if (pathname.startsWith("/patients")) return { title: "Patients", crumbs: ["Workspace", "Patients"] };
    if (pathname.startsWith("/appointments")) return { title: "Appointments", crumbs: ["Workspace", "Appointments"] };
    if (pathname.startsWith("/hospitals")) return { title: "Hospitals", crumbs: ["Workspace", "Hospitals"] };
    if (pathname.startsWith("/consultations")) return { title: "Consultations", crumbs: ["Workspace", "Consultations"] };
    if (pathname.startsWith("/admin")) return { title: "Admin", crumbs: ["Workspace", "Admin"] };
    if (pathname.startsWith("/masters")) return { title: "Masters", crumbs: ["Workspace", "Masters"] };
    return { title: "Refera", crumbs: ["Workspace"] };
  }, [pathname]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Auth guard — redirect unauthenticated users to /login
  useEffect(() => {
    if (ready && !user && location.pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [ready, user, location.pathname, navigate]);

  // Admin route guard — only Admins can view /admin and /masters
  useEffect(() => {
    if (
      ready &&
      user &&
      (location.pathname.startsWith("/admin") || location.pathname.startsWith("/masters")) &&
      user.role !== "Admin"
    ) {
      toast.error("Admin access only", { description: "You don't have permission to view this page." });
      navigate({ to: "/" });
    }
  }, [ready, user, location.pathname, navigate]);

  // Theme toggle (root <html> already uses .dark)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Activity: log navigation while signed in
  useEffect(() => {
    if (!ready || !user) return;
    void logActivity("navigate", { route: location.pathname });
  }, [ready, user, location.pathname]);

  const active: AuthUser = user ?? DEFAULT_USER;
  const initials = active.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const { title, crumbs } = useTitleFromPath(location.pathname);
  useRealtimeTables(["user_activity", "user_sessions"], [["activity-feed"]]);
  const { data: notifications = [] } = useQuery({
    queryKey: ["activity-feed"],
    enabled: active.role === "Admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_activity")
        .select("id,user_name,user_email,user_role,event_type,action,created_at")
        .in("event_type", ["login", "logout"])
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate({ to: "/admin" });
    toast.message(`Searching "${search}"`, { description: "Opened admin search across live data." });
  };

  const onLogout = async () => {
    await logActivity("logout", { action: "Signed out" });
    await finishUserSession();
    await supabase.auth.signOut();
    setStoredUser(null);
    resetActivitySession();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <SidebarBody pathname={location.pathname} organization={active.organization} role={active.role} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-sidebar text-sidebar-foreground border-r border-border"
        >
          <SidebarBody pathname={location.pathname} organization={active.organization} role={active.role} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
          {/* Row 1 — utility bar */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 h-14">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground hover:text-foreground"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <form onSubmit={submitSearch} className="relative hidden sm:block flex-1 min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients, referrals, specialists…"
                className="pl-9 pr-14 h-9 bg-input/60 border-border w-full min-w-0"
              />
              <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </form>
            <div className="sm:hidden flex items-center gap-2 flex-1 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                <Activity className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold tracking-tight">Refera</span>
            </div>
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
                  {notifications.map((n) => {
                    const Icon = n.event_type === "logout" ? LogOut : Activity;
                    const tone = n.event_type === "logout"
                      ? "text-[oklch(var(--status-warn))] bg-[var(--status-warn-bg)]"
                      : "text-[oklch(var(--status-success))] bg-[var(--status-success-bg)]";
                    const at = new Date(n.created_at);
                    return (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                        <div className={cn("h-7 w-7 rounded-md grid place-items-center shrink-0", tone)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-snug">{n.user_name ?? n.user_email ?? "Clinician"} {n.event_type === "logout" ? "signed out" : "signed in"}</div>
                          <div className="text-xs text-muted-foreground truncate">{n.user_role ?? "User"} · {n.action ?? n.event_type}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums shrink-0">{at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    );
                  })}
                  {notifications.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">No login activity yet.</div>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-border">
                  <Link to="/admin" className="text-xs text-primary hover:underline">
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
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ tab: "profile" }}>
                    <UserCircle2 className="h-4 w-4 mr-2" /> Profile preferences
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ tab: "security" }}>
                    <ShieldCheck className="h-4 w-4 mr-2" /> Security & audit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ tab: "shortcuts" }}>
                    <Keyboard className="h-4 w-4 mr-2" /> Keyboard shortcuts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/help">
                    <HelpCircle className="h-4 w-4 mr-2" /> Help & support
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/referrals/new">
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-glow gap-1.5 px-2.5 sm:px-4">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New referral</span>
              </Button>
            </Link>

            <Separator orientation="vertical" className="h-7 mx-1 hidden sm:block" />

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
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ tab: "profile" }}>
                    <UserCircle2 className="h-4 w-4 mr-2" /> My profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ tab: "notifications" }}>
                    <Bell className="h-4 w-4 mr-2" /> Notification settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-[oklch(var(--status-danger))] focus:text-[oklch(var(--status-danger))]">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2 — context bar with breadcrumbs */}
          <div className="flex items-center gap-2 px-3 sm:px-6 h-10 border-t border-border/60 bg-background/40">
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

function SidebarBody({ pathname, organization, role }: { pathname: string; organization: string; role: AuthUser["role"] }) {
  const visibleNav = nav.filter((n) => !("adminOnly" in n && n.adminOnly) || role === "Admin");
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
          <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Refera</div>
          <div className="text-[11px] text-muted-foreground">Clinical referrals</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {visibleNav.map((item) => {
          const isActive =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={`${item.label} — ${item.hint}`}
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
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Organisation
            </span>
          </div>
          <div className="text-sm font-medium leading-tight">{organization}</div>
          <div className="text-[11px] text-muted-foreground">FHIR R4 endpoint healthy</div>
        </div>
      </div>
    </div>
  );
}