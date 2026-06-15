import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Pill,
  FileText,
  BarChart3,
  Sparkles,
  Settings,
  Activity,
  Menu,
  Bell,
  Search,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/healix", label: "Dashboard", icon: LayoutDashboard },
  { to: "/healix/patients", label: "Patients", icon: Users },
  { to: "/healix/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/healix/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/healix/records", label: "Records", icon: FileText },
  { to: "/healix/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/healix/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/healix/settings", label: "Settings", icon: Settings },
] as const;

export function HealixShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <Brand />
        <SidebarBody pathname={location.pathname} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-r border-border">
          <Brand />
          <SidebarBody pathname={location.pathname} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 h-14">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refera</span>
            </Link>
            <div className="relative hidden md:block flex-1 min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients, encounters, meds…" className="pl-9 h-9 bg-input/60 w-full min-w-0" />
            </div>
            <div className="flex-1 md:hidden" />
            <Badge variant="outline" className="hidden sm:inline-flex gap-1 border-[oklch(var(--status-success))]/40 text-[oklch(var(--status-success))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(var(--status-success))]" />
              FHIR R4 · mock
            </Badge>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[oklch(var(--status-danger))]" />
            </Button>
            {actions}
          </div>

          <div className="flex items-end justify-between gap-3 px-3 sm:px-6 py-3 border-t border-border/60 bg-background/40">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">HEALIX AI</div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="px-3 sm:px-6 py-5 sm:py-6 max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
      <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
        <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">HEALIX AI</div>
        <div className="text-[11px] text-muted-foreground">Clinical intelligence</div>
      </div>
    </div>
  );
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {NAV.map(({ to, label, icon: Icon }) => {
          const isActive = to === "/healix" ? pathname === "/healix" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-elegant"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="px-4 py-3">
        <Link to="/" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Back to Refera workspace
        </Link>
      </div>
    </div>
  );
}