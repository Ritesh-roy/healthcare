import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HealixShell } from "@/components/healix/HealixShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/healix/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — HEALIX AI" },
      { name: "description", content: "Population health, revenue and operational analytics." },
    ],
  }),
  component: AnalyticsPage,
});

const revenueTrend = Array.from({ length: 12 }, (_, i) => ({
  m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  inpatient: 120 + Math.round(Math.random() * 60),
  outpatient: 180 + Math.round(Math.random() * 80),
}));

const disease = [
  { name: "Diabetes", value: 38 },
  { name: "Hypertension", value: 28 },
  { name: "CAD", value: 14 },
  { name: "Asthma", value: 9 },
  { name: "Thyroid", value: 6 },
  { name: "Other", value: 5 },
];

const ageMix = [
  { age: "0-17", patients: 12 },
  { age: "18-29", patients: 28 },
  { age: "30-44", patients: 41 },
  { age: "45-59", patients: 56 },
  { age: "60-74", patients: 47 },
  { age: "75+", patients: 22 },
];

const COLORS = ["oklch(0.78 0.16 215)", "oklch(0.72 0.18 175)", "oklch(0.74 0.16 250)", "oklch(0.78 0.16 75)", "oklch(0.68 0.22 22)", "oklch(0.62 0.06 260)"];

function AnalyticsPage() {
  return (
    <HealixShell title="Analytics" subtitle="Population health, revenue & operations">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue — 12 months</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.02 230 / 30%)" />
                <XAxis dataKey="m" stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 235)", border: "1px solid oklch(0.32 0.02 230 / 45%)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="outpatient" stackId="a" fill="oklch(0.78 0.16 215)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="inpatient" stackId="a" fill="oklch(0.74 0.16 250)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Disease prevalence</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={disease} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {disease.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 235)", border: "1px solid oklch(0.32 0.02 230 / 45%)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader><CardTitle className="text-base">Patient age distribution</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ageMix}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.02 230 / 30%)" />
                <XAxis dataKey="age" stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.66 0.025 230)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 235)", border: "1px solid oklch(0.32 0.02 230 / 45%)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="patients" stroke="oklch(0.78 0.16 215)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </HealixShell>
  );
}