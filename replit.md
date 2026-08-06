# MediGuide AI

MediGuide AI is a calm healthcare companion that guides users through symptom intake, explains urgency, creates consultation summaries, and keeps a private health timeline.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mediguide-ai/` — React + Vite user experience with dashboard, consultation, timeline, reports, and workflow routes
- `artifacts/api-server/` — Express API for consultation intake, summaries, reports, dashboard aggregates, and workflow agents
- `lib/api-spec/openapi.yaml` — source of truth for the typed API contract
- `lib/db/src/schema/consultations.ts` — persisted consultation and message record
- `artifacts/api-server/src/lib/mediguide.ts` — modular intake, risk detection, summary, and workflow logic

## Architecture decisions

- API contracts are defined in OpenAPI first and generated into the shared React client and Zod validators.
- Consultations are stored as a single record with JSON message and summary fields so the complete user-facing case stays together.
- The first implementation uses transparent, deterministic intake and emergency-signal rules so the experience remains safe and testable without exposing model reasoning.
- Risk levels are explicit (`green`, `yellow`, `orange`, `red`) and every non-green outcome includes a plain-language reason.

## Product

- Dashboard overview with consultation counts, recent reports, average risk, and risk breakdown
- Guided consultation chat that asks one follow-up question at a time
- Emergency signal detection that pauses normal intake and recommends immediate care
- Structured case summaries with confidence, possible educational context, next steps, and disclaimer
- Consultation timeline with reopen support and report views
- Judge-facing AI workflow page describing all seven agents from intake through memory

## User preferences

The uploaded brief asked to preserve an existing MediGuide product direction and make the result feel like a premium healthcare SaaS product.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm run typecheck:libs` before checking the API server when shared schemas change.
- The app intentionally states that it is educational guidance, not a diagnosis or substitute for professional care.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
