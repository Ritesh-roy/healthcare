
## Goal

Add **HEALIX AI** as a new, self-contained healthcare EMR/EHR module inside the existing Refera project, without removing or modifying any existing functionality. All existing routes (`/`, `/referrals`, `/patients`, `/appointments`, `/hospitals`, `/consultations`, `/admin`, `/masters`, `/settings`, `/help`, `/login`) keep working exactly as today.

The current stack is TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 on Cloudflare Workers (Lovable hosting). HEALIX AI will be built on this stack — your Next.js/Prisma/Redis/Socket.io/Docker spec maps cleanly to TanStack Start + Lovable Cloud (Supabase under the hood) + Lovable AI Gateway. No new infra to install; same deploy pipeline.

## Architecture

```text
src/routes/
  (existing routes — untouched)
  healix.tsx                  layout (Outlet) — own AppShell, theme, sidebar
  healix.index.tsx            HEALIX dashboard (KPIs, charts, AI panel)
  healix.patients.tsx         Patient directory + filters
  healix.patients.$id.tsx     360° patient profile (timeline, vitals, meds, labs, allergies, encounters)
  healix.appointments.tsx     Calendar + scheduling
  healix.prescriptions.tsx    E-prescription builder + history
  healix.records.tsx          Medical records / documents
  healix.analytics.tsx        Population health analytics
  healix.ai.tsx               AI assistant (clinical summary, differential, drafting)
  healix.settings.tsx         Org, roles, FHIR endpoint config

src/components/healix/
  HealixShell.tsx             dedicated shell (sidebar + topbar, mobile-first)
  PatientCard.tsx, VitalsRing.tsx, TimelineEvent.tsx, AiPanel.tsx, FhirStatusPill.tsx, …

src/lib/healix/
  fhir/
    types.ts                  FHIR R4 TS types (Patient, Encounter, Observation, Condition,
                              MedicationRequest, AllergyIntolerance, DiagnosticReport, Practitioner)
    client.ts                 FhirClient interface — single seam for swap
    mock-client.ts            in-memory mock implementing FhirClient (returns FHIR-shaped data)
    rest-client.ts            stub for real FHIR R4 REST (Bearer auth, search params) — wired
                              behind a feature flag, off by default
    index.ts                  getFhirClient() picks mock vs rest from env
  queries.ts                  TanStack Query keys + queryOptions (ensureQueryData pattern)
  rbac.ts                     roles: SuperAdmin, Admin, Doctor, Nurse, Receptionist, Patient
  mock-data.ts                seeded realistic patients/encounters/vitals/meds

src/routes/api/healix/
  ai.ts                       server route → Lovable AI Gateway (clinical summary, Q&A)
  fhir.$.ts                   optional proxy for real FHIR endpoints (kept off until wired)
```

Key principles:

- **Isolation**: HEALIX uses its own shell, sidebar, theme tokens (light + dark), and route tree under `/healix/*`. Refera AppShell is not touched.
- **One seam for FHIR**: every read/write goes through `FhirClient`. Swapping `mock-client` → `rest-client` is a single env flip; components never change.
- **Data layer**: TanStack Query everywhere (`ensureQueryData` in loaders, `useSuspenseQuery` in components). Stale-while-revalidate, dedupe, background refetch.
- **RBAC**: role gate utility used by route `beforeLoad` and to hide controls. Mock auth uses the existing `useAuth`; production swap goes to Lovable Cloud Auth + `user_roles` table when you enable Cloud.
- **AI**: server route + Lovable AI Gateway (`google/gemini-2.5-flash`) for the assistant. Streaming-ready.
- **Mobile-first**: every page uses responsive grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`), sticky topbar, drawer sidebar < md, `min-w-0` everywhere to prevent horizontal scroll.
- **Performance**: lazy-loaded charts (`recharts` already installed), memoized lists, image-free hero sections, route-level code splitting via file-based routes.
- **Future-proof**: types match FHIR R4 exactly so when you point at a real FHIR server (HAPI, Medplum, Epic, Cerner) no component touches.

## Deployment fix

Investigate and resolve the `No such module "assets/h3-v2"` runtime error on Vercel/Cloudflare. Likely fixes (in order of probability):

1. Pin `nitro` and `@tanstack/react-start` to compatible versions; clear stale `nitro` beta if it's bundling h3 v2 incorrectly.
2. Ensure `vite.config.ts` does not externalize SSR deps for the Worker target (per server-runtime rules).
3. If Vercel: add proper SSR adapter config / output dir so the function bundle includes h3.

Pure config/lockfile changes — no app code removed.

## Tech stack mapping (your spec → what we build on)

| You asked for | We use | Why |
|---|---|---|
| Next.js 15 / Node.js | TanStack Start v1 + server functions / server routes | Stack of this project; same SSR + RPC model |
| PostgreSQL + Prisma | Lovable Cloud (Supabase Postgres) | Managed, RLS, no setup |
| Redis | TanStack Query cache + Supabase | App-level cache is enough for v1 |
| Socket.io | Supabase Realtime (when Cloud is on) | Same publish/subscribe semantics |
| JWT Auth | Lovable Cloud Auth (JWT under the hood) | Built in |
| Docker | Lovable hosting (Cloudflare Workers) | One-click deploy |
| FHIR R4 | Mock client now, REST client seam ready | No refactor when you plug live FHIR |

## What v1 ships

Production-grade UI + flows, fully wired with mock FHIR data:

1. HEALIX dashboard — KPIs (patients today, appts, critical alerts, revenue), live vitals strip, appointment timeline, AI insights card, recent activity.
2. Patient directory — search/filter/sort, virtualized-ready list, status pills.
3. Patient 360 — header (demographics, allergies, code status), vitals charts, conditions, meds, labs, encounters timeline, documents, AI summary button.
4. Appointments — week/day calendar, create/reschedule, no past-date booking (matches your earlier rule).
5. E-prescription builder — drug picker, dose/freq/duration, printable PDF (jspdf already installed).
6. Medical records — document list with type filters.
7. Analytics — population health charts (recharts).
8. AI assistant — chat panel calling Lovable AI Gateway server route, with patient context injection.
9. Settings — org profile, FHIR endpoint URL/token (stored in Cloud secrets when enabled).

## What v2 will add (not in this build)

- Real FHIR REST wiring (flip `VITE_HEALIX_FHIR_MODE=rest`).
- Lovable Cloud enablement: real auth, persistent DB tables (`healix_patients`, `healix_appointments`, etc.), RLS by org + role, audit log table.
- Telemedicine (WebRTC), WhatsApp/SMS/Email via providers, payment gateway.
- HIPAA/HL7 hardening.

These are intentionally staged so v1 ships clean and you can validate UX before wiring backends.

## Open questions

1. **Entry point**: add a HEALIX launcher card on the existing Refera dashboard, or only reachable via direct URL `/healix`? (Recommend launcher card.)
2. **Cloud now or later?** I can build v1 against mocks today, then enable Lovable Cloud as v2 to wire real auth + DB. Confirm if that's OK or you want Cloud enabled now (adds DB tables this turn).
3. **Branding**: HEALIX AI color identity — should I go with a medical teal/indigo gradient (distinct from Refera's current purple), or match Refera's palette?

I'll start implementing as soon as you confirm — I'll proceed with launcher card + mocks-only + medical teal/indigo unless you say otherwise.
