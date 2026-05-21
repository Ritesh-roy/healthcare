import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Database, Plus, Pencil, Trash2, Users, Building2, ShieldCheck, KeyRound, UserCog, Network, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  masterStore, useMaster, newId,
  type Department, type Employee, type Permission, type Role, type MasterUser, type Organization, type TimeSlot,
} from "@/lib/master-store";
import { practitioners } from "@/lib/mock-data";
import "@/lib/chest-data";
import { chestHospitals } from "@/lib/chest-data";

export const Route = createFileRoute("/masters")({
  head: () => ({ meta: [{ title: "Masters — Refera" }] }),
  component: MastersPage,
});

function MastersPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Master tables
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employees, departments, users, roles and permissions for your workspace.
          </p>
        </div>

        <Tabs defaultValue="users">
          <div className="-mx-4 sm:mx-0 overflow-x-auto no-scrollbar">
            <TabsList className="inline-flex w-max sm:w-auto sm:grid sm:grid-cols-7 mx-4 sm:mx-0">
              <TabsTrigger value="employees" className="gap-1.5 whitespace-nowrap"><Users className="h-3.5 w-3.5" />Employees</TabsTrigger>
              <TabsTrigger value="departments" className="gap-1.5 whitespace-nowrap"><Building2 className="h-3.5 w-3.5" />Departments</TabsTrigger>
              <TabsTrigger value="organizations" className="gap-1.5 whitespace-nowrap"><Network className="h-3.5 w-3.5" />Organizations</TabsTrigger>
              <TabsTrigger value="timeslots" className="gap-1.5 whitespace-nowrap"><Clock className="h-3.5 w-3.5" />Time slots</TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 whitespace-nowrap"><UserCog className="h-3.5 w-3.5" />Users</TabsTrigger>
              <TabsTrigger value="roles" className="gap-1.5 whitespace-nowrap"><ShieldCheck className="h-3.5 w-3.5" />Roles</TabsTrigger>
              <TabsTrigger value="permissions" className="gap-1.5 whitespace-nowrap"><KeyRound className="h-3.5 w-3.5" />Permissions</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="employees" className="mt-4"><EmployeesTab /></TabsContent>
          <TabsContent value="departments" className="mt-4"><DepartmentsTab /></TabsContent>
          <TabsContent value="organizations" className="mt-4"><OrganizationsTab /></TabsContent>
          <TabsContent value="timeslots" className="mt-4"><TimeSlotsTab /></TabsContent>
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
          <TabsContent value="roles" className="mt-4"><RolesTab /></TabsContent>
          <TabsContent value="permissions" className="mt-4"><PermissionsTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/* ============ ORGANIZATIONS ============ */
function OrganizationsTab() {
  const items = useMaster<Organization>(masterStore.organizations);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const empty: Organization = { id: "", name: "", hospitalIds: [], branch: "", contact: "", active: true };
  const [form, setForm] = useState<Organization>(empty);

  const startNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (o: Organization) => { setEditing(o); setForm(o); setOpen(true); };
  const remove = (id: string) => { masterStore.setOrganizations(items.filter((x) => x.id !== id)); toast.success("Organization deleted"); };
  const save = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (editing) { masterStore.setOrganizations(items.map((x) => (x.id === editing.id ? form : x))); toast.success("Organization updated"); }
    else { masterStore.setOrganizations([...items, { ...form, id: newId("o") }]); toast.success("Organization created"); }
    setOpen(false);
  };
  const toggleHosp = (id: string) => {
    setForm((f) => ({ ...f, hospitalIds: f.hospitalIds.includes(id) ? f.hospitalIds.filter((x) => x !== id) : [...f.hospitalIds, id] }));
  };

  return (
    <CrudCard title={`Organizations (${items.length})`} onNew={startNew}>
      <table className="w-full text-sm min-w-[760px]">
        <THead cols={["Name", "Branch", "Hospitals", "Contact", "Status", ""]} />
        <tbody className="divide-y divide-border">
          {items.map((o) => (
            <tr key={o.id} className="hover:bg-accent/40">
              <td className="px-5 py-3 font-medium">{o.name}</td>
              <td className="px-5 py-3 text-muted-foreground">{o.branch}</td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {o.hospitalIds.map((hid) => {
                    const h = chestHospitals.find((x) => x.id === hid);
                    return h ? <Badge key={hid} variant="secondary" className="text-[10px]">{h.name}</Badge> : null;
                  })}
                  {o.hospitalIds.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                </div>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{o.contact}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1.5 text-xs ${o.active ? "text-[oklch(var(--status-success))]" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${o.active ? "bg-[oklch(var(--status-success))]" : "bg-muted-foreground"}`} />
                  {o.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-5 py-3"><RowActions onEdit={() => startEdit(o)} onDelete={() => remove(o.id)} label={o.name} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit organization" : "New organization"} onSave={save} wide>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Branch"><Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></Field>
          <Field label="Contact"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
        </div>
        <div>
          <Label className="text-sm">Hospitals</Label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 rounded-md border border-border bg-card/40">
            {chestHospitals.map((h) => (
              <label key={h.id} className="flex items-start gap-2 cursor-pointer hover:bg-accent/40 rounded px-2 py-1.5">
                <Checkbox checked={form.hospitalIds.includes(h.id)} onCheckedChange={() => toggleHosp(h.id)} />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{h.name}</div>
                  <div className="text-[11px] text-muted-foreground">{h.city}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <Label className="text-sm">Active</Label>
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        </div>
      </FormDialog>
    </CrudCard>
  );
}

/* ============ TIME SLOTS ============ */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function TimeSlotsTab() {
  const items = useMaster<TimeSlot>(masterStore.timeslots);
  const specialists = practitioners.filter((p) => p.role === "Specialist");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TimeSlot | null>(null);
  const empty: TimeSlot = { id: "", practitionerId: specialists[0]?.id ?? "", weekday: 1, start: "09:00", end: "13:00", emergency: false, blocked: false };
  const [form, setForm] = useState<TimeSlot>(empty);

  const startNew = () => { setEditing(null); setForm({ ...empty, practitionerId: specialists[0]?.id ?? "" }); setOpen(true); };
  const startEdit = (s: TimeSlot) => { setEditing(s); setForm(s); setOpen(true); };
  const remove = (id: string) => { masterStore.setTimeSlots(items.filter((x) => x.id !== id)); toast.success("Slot deleted"); };
  const save = () => {
    if (!form.practitionerId) return toast.error("Doctor is required");
    if (form.start >= form.end) return toast.error("End time must be after start time");
    if (editing) { masterStore.setTimeSlots(items.map((x) => (x.id === editing.id ? form : x))); toast.success("Slot updated"); }
    else { masterStore.setTimeSlots([...items, { ...form, id: newId("ts") }]); toast.success("Slot created"); }
    setOpen(false);
  };
  const docName = (id: string) => practitioners.find((p) => p.id === id)?.name ?? "—";

  return (
    <CrudCard title={`Time slots (${items.length})`} onNew={startNew}>
      <table className="w-full text-sm min-w-[760px]">
        <THead cols={["Doctor", "Weekday", "Window", "Type", "Status", ""]} />
        <tbody className="divide-y divide-border">
          {items.map((s) => (
            <tr key={s.id} className="hover:bg-accent/40">
              <td className="px-5 py-3 font-medium">{docName(s.practitionerId)}</td>
              <td className="px-5 py-3 text-muted-foreground">{WEEKDAYS[s.weekday]}</td>
              <td className="px-5 py-3 tabular-nums">{s.start} – {s.end}</td>
              <td className="px-5 py-3">
                {s.emergency
                  ? <Badge variant="outline" className="text-[10px] border-[oklch(var(--status-danger))]/60 text-[oklch(var(--status-danger))]">Emergency</Badge>
                  : <Badge variant="secondary" className="text-[10px]">Regular</Badge>}
              </td>
              <td className="px-5 py-3">
                <span className={`text-xs ${s.blocked ? "text-[oklch(var(--status-warn))]" : "text-[oklch(var(--status-success))]"}`}>
                  {s.blocked ? "Blocked" : "Open"}
                </span>
              </td>
              <td className="px-5 py-3"><RowActions onEdit={() => startEdit(s)} onDelete={() => remove(s.id)} label={`${docName(s.practitionerId)} · ${WEEKDAYS[s.weekday]}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit time slot" : "New time slot"} onSave={save} wide>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Doctor *">
            <Select value={form.practitionerId} onValueChange={(v) => setForm({ ...form, practitionerId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{specialists.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.specialty}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Weekday">
            <Select value={String(form.weekday)} onValueChange={(v) => setForm({ ...form, weekday: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{WEEKDAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Start"><Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
          <Field label="End"><Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <Label className="text-sm">Emergency slot</Label>
          <Switch checked={form.emergency} onCheckedChange={(v) => setForm({ ...form, emergency: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Blocked (unavailable)</Label>
          <Switch checked={form.blocked} onCheckedChange={(v) => setForm({ ...form, blocked: v })} />
        </div>
      </FormDialog>
    </CrudCard>
  );
}

/* ============ DEPARTMENTS ============ */
function DepartmentsTab() {
  const items = useMaster<Department>(masterStore.departments);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<Department>({ id: "", name: "", head: "", description: "" });

  const startNew = () => { setEditing(null); setForm({ id: "", name: "", head: "", description: "" }); setOpen(true); };
  const startEdit = (d: Department) => { setEditing(d); setForm(d); setOpen(true); };
  const remove = (id: string) => { masterStore.setDepartments(items.filter((x) => x.id !== id)); toast.success("Department deleted"); };
  const save = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (editing) {
      masterStore.setDepartments(items.map((x) => (x.id === editing.id ? form : x)));
      toast.success("Department updated");
    } else {
      masterStore.setDepartments([...items, { ...form, id: newId("d") }]);
      toast.success("Department created");
    }
    setOpen(false);
  };

  return (
    <CrudCard title={`Departments (${items.length})`} onNew={startNew}>
      <table className="w-full text-sm min-w-[640px]">
        <THead cols={["Name", "Head", "Description", ""]} />
        <tbody className="divide-y divide-border">
          {items.map((d) => (
            <tr key={d.id} className="hover:bg-accent/40">
              <td className="px-5 py-3 font-medium">{d.name}</td>
              <td className="px-5 py-3 text-muted-foreground">{d.head}</td>
              <td className="px-5 py-3 text-muted-foreground">{d.description}</td>
              <td className="px-5 py-3"><RowActions onEdit={() => startEdit(d)} onDelete={() => remove(d.id)} label={d.name} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit department" : "New department"} onSave={save}>
        <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Head"><Input value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} /></Field>
        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </FormDialog>
    </CrudCard>
  );
}

/* ============ EMPLOYEES ============ */
function EmployeesTab() {
  const items = useMaster<Employee>(masterStore.employees);
  const depts = useMaster<Department>(masterStore.departments);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Employee>({ id: "", name: "", email: "", phone: "", departmentId: "", designation: "", joinedAt: "" });

  const startNew = () => { setEditing(null); setForm({ id: "", name: "", email: "", phone: "", departmentId: depts[0]?.id ?? "", designation: "", joinedAt: new Date().toISOString().slice(0, 10) }); setOpen(true); };
  const startEdit = (e: Employee) => { setEditing(e); setForm(e); setOpen(true); };
  const remove = (id: string) => { masterStore.setEmployees(items.filter((x) => x.id !== id)); toast.success("Employee deleted"); };
  const save = () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error("Name and email are required");
    if (editing) {
      masterStore.setEmployees(items.map((x) => (x.id === editing.id ? form : x)));
      toast.success("Employee updated");
    } else {
      masterStore.setEmployees([...items, { ...form, id: newId("e") }]);
      toast.success("Employee created");
    }
    setOpen(false);
  };
  const deptName = (id: string) => depts.find((d) => d.id === id)?.name ?? "—";

  return (
    <CrudCard title={`Employees (${items.length})`} onNew={startNew}>
      <table className="w-full text-sm min-w-[760px]">
        <THead cols={["Name", "Designation", "Department", "Email", "Phone", "Joined", ""]} />
        <tbody className="divide-y divide-border">
          {items.map((e) => (
            <tr key={e.id} className="hover:bg-accent/40">
              <td className="px-5 py-3 font-medium">{e.name}</td>
              <td className="px-5 py-3 text-muted-foreground">{e.designation}</td>
              <td className="px-5 py-3 text-muted-foreground">{deptName(e.departmentId)}</td>
              <td className="px-5 py-3 text-muted-foreground">{e.email}</td>
              <td className="px-5 py-3 text-muted-foreground">{e.phone}</td>
              <td className="px-5 py-3 text-muted-foreground tabular-nums">{e.joinedAt}</td>
              <td className="px-5 py-3"><RowActions onEdit={() => startEdit(e)} onDelete={() => remove(e.id)} label={e.name} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit employee" : "New employee"} onSave={save}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name *"><Input value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })} /></Field>
          <Field label="Designation"><Input value={form.designation} onChange={(ev) => setForm({ ...form, designation: ev.target.value })} /></Field>
          <Field label="Email *"><Input type="email" value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(ev) => setForm({ ...form, phone: ev.target.value })} /></Field>
          <Field label="Department">
            <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Joined"><Input type="date" value={form.joinedAt} onChange={(ev) => setForm({ ...form, joinedAt: ev.target.value })} /></Field>
        </div>
      </FormDialog>
    </CrudCard>
  );
}

/* ============ USERS ============ */
function UsersTab() {
  const items = useMaster<MasterUser>(masterStore.users);
  const roles = useMaster<Role>(masterStore.roles);
  const employees = useMaster<Employee>(masterStore.employees);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MasterUser | null>(null);
  const empty: MasterUser = { id: "", username: "", email: "", fullName: "", roleId: roles[0]?.id ?? "", active: true };
  const [form, setForm] = useState<MasterUser>(empty);

  const startNew = () => { setEditing(null); setForm({ ...empty, roleId: roles[0]?.id ?? "" }); setOpen(true); };
  const startEdit = (u: MasterUser) => { setEditing(u); setForm(u); setOpen(true); };
  const remove = (id: string) => { masterStore.setUsers(items.filter((x) => x.id !== id)); toast.success("User deleted"); };
  const save = () => {
    if (!form.username.trim() || !form.email.trim() || !form.fullName.trim()) return toast.error("Username, email and full name are required");
    if (!form.roleId) return toast.error("Role is required");
    if (editing) {
      masterStore.setUsers(items.map((x) => (x.id === editing.id ? form : x)));
      toast.success("User updated");
    } else {
      masterStore.setUsers([...items, { ...form, id: newId("us") }]);
      toast.success("User created");
    }
    setOpen(false);
  };
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "—";

  return (
    <CrudCard title={`Users (${items.length})`} onNew={startNew}>
      <table className="w-full text-sm min-w-[760px]">
        <THead cols={["Full name", "Username", "Email", "Role", "Status", ""]} />
        <tbody className="divide-y divide-border">
          {items.map((u) => (
            <tr key={u.id} className="hover:bg-accent/40">
              <td className="px-5 py-3 font-medium">{u.fullName}</td>
              <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{u.username}</td>
              <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-5 py-3"><Badge variant="outline">{roleName(u.roleId)}</Badge></td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1.5 text-xs ${u.active ? "text-[oklch(var(--status-success))]" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-[oklch(var(--status-success))]" : "bg-muted-foreground"}`} />
                  {u.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-5 py-3"><RowActions onEdit={() => startEdit(u)} onDelete={() => remove(u.id)} label={u.fullName} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit user" : "New user"} onSave={save} wide>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name *"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Username *"><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Role *">
            <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Linked employee">
            <Select value={form.employeeId ?? "none"} onValueChange={(v) => setForm({ ...form, employeeId: v === "none" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Linked doctor (for patient scoping)">
            <Select value={form.practitionerId ?? "none"} onValueChange={(v) => setForm({ ...form, practitionerId: v === "none" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {practitioners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.role}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <Label htmlFor="active-switch" className="text-sm">Active account</Label>
          <Switch id="active-switch" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        </div>
      </FormDialog>
    </CrudCard>
  );
}

/* ============ ROLES ============ */
function RolesTab() {
  const items = useMaster<Role>(masterStore.roles);
  const perms = useMaster<Permission>(masterStore.permissions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<Role>({ id: "", name: "", description: "", permissionIds: [] });

  const startNew = () => { setEditing(null); setForm({ id: "", name: "", description: "", permissionIds: [] }); setOpen(true); };
  const startEdit = (r: Role) => { setEditing(r); setForm(r); setOpen(true); };
  const remove = (id: string) => { masterStore.setRoles(items.filter((x) => x.id !== id)); toast.success("Role deleted"); };
  const save = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (editing) { masterStore.setRoles(items.map((x) => (x.id === editing.id ? form : x))); toast.success("Role updated"); }
    else { masterStore.setRoles([...items, { ...form, id: newId("r") }]); toast.success("Role created"); }
    setOpen(false);
  };
  const togglePerm = (id: string) => {
    setForm((f) => ({
      ...f,
      permissionIds: f.permissionIds.includes(id) ? f.permissionIds.filter((p) => p !== id) : [...f.permissionIds, id],
    }));
  };

  return (
    <CrudCard title={`Roles (${items.length})`} onNew={startNew}>
      <table className="w-full text-sm min-w-[640px]">
        <THead cols={["Role", "Description", "Permissions", ""]} />
        <tbody className="divide-y divide-border">
          {items.map((r) => (
            <tr key={r.id} className="hover:bg-accent/40">
              <td className="px-5 py-3 font-medium">{r.name}</td>
              <td className="px-5 py-3 text-muted-foreground">{r.description}</td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {r.permissionIds.length === 0 ? <span className="text-xs text-muted-foreground">None</span> :
                    r.permissionIds.slice(0, 4).map((pid) => {
                      const p = perms.find((x) => x.id === pid);
                      return p ? <Badge key={pid} variant="secondary" className="text-[10px]">{p.label}</Badge> : null;
                    })}
                  {r.permissionIds.length > 4 && <Badge variant="outline" className="text-[10px]">+{r.permissionIds.length - 4}</Badge>}
                </div>
              </td>
              <td className="px-5 py-3"><RowActions onEdit={() => startEdit(r)} onDelete={() => remove(r.id)} label={r.name} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit role" : "New role"} onSave={save} wide>
        <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div>
          <Label className="text-sm">Permissions</Label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 rounded-md border border-border bg-card/40">
            {perms.map((p) => (
              <label key={p.id} className="flex items-start gap-2 cursor-pointer hover:bg-accent/40 rounded px-2 py-1.5">
                <Checkbox checked={form.permissionIds.includes(p.id)} onCheckedChange={() => togglePerm(p.id)} />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground">{p.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </FormDialog>
    </CrudCard>
  );
}

/* ============ PERMISSIONS ============ */
function PermissionsTab() {
  const items = useMaster<Permission>(masterStore.permissions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [form, setForm] = useState<Permission>({ id: "", key: "", label: "", description: "" });

  const startNew = () => { setEditing(null); setForm({ id: "", key: "", label: "", description: "" }); setOpen(true); };
  const startEdit = (p: Permission) => { setEditing(p); setForm(p); setOpen(true); };
  const remove = (id: string) => { masterStore.setPermissions(items.filter((x) => x.id !== id)); toast.success("Permission deleted"); };
  const save = () => {
    if (!form.key.trim() || !form.label.trim()) return toast.error("Key and label are required");
    if (editing) { masterStore.setPermissions(items.map((x) => (x.id === editing.id ? form : x))); toast.success("Permission updated"); }
    else { masterStore.setPermissions([...items, { ...form, id: newId("pm") }]); toast.success("Permission created"); }
    setOpen(false);
  };

  return (
    <CrudCard title={`Permissions (${items.length})`} onNew={startNew}>
      <table className="w-full text-sm min-w-[640px]">
        <THead cols={["Key", "Label", "Description", ""]} />
        <tbody className="divide-y divide-border">
          {items.map((p) => (
            <tr key={p.id} className="hover:bg-accent/40">
              <td className="px-5 py-3 font-mono text-xs text-primary">{p.key}</td>
              <td className="px-5 py-3 font-medium">{p.label}</td>
              <td className="px-5 py-3 text-muted-foreground">{p.description}</td>
              <td className="px-5 py-3"><RowActions onEdit={() => startEdit(p)} onDelete={() => remove(p.id)} label={p.label} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit permission" : "New permission"} onSave={save}>
        <Field label="Key *"><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. patients.view" /></Field>
        <Field label="Label *"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </FormDialog>
    </CrudCard>
  );
}

/* ============ shared bits ============ */
function CrudCard({ title, onNew, children }: { title: string; onNew: () => void; children: React.ReactNode }) {
  return (
    <Card className="glass-panel border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button onClick={onNew} className="bg-gradient-primary text-primary-foreground shadow-glow gap-1.5"><Plus className="h-4 w-4" />New</Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
      <tr className="border-b border-border">{cols.map((c, i) => <th key={i} className="text-left px-5 py-3 font-medium">{c}</th>)}</tr>
    </thead>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function FormDialog({ open, onOpenChange, title, onSave, children, wide }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; onSave: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={wide ? "max-w-2xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} className="bg-gradient-primary text-primary-foreground shadow-glow">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-[oklch(var(--status-danger))]" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
