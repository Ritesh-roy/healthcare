import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/foot-assessments")({
  head: () => ({ meta: [{ title: "Foot & Toe Pressure Assessment — Refera" }] }),
  component: () => <Outlet />,
});