# MediGuide AI

MediGuide AI is an agentic healthcare companion that guides users through symptom intake, asks focused follow-up questions, explains urgency, creates an educational case summary, and keeps a private consultation timeline.

## Included

- React + Vite frontend with dashboard, consultation, timeline, reports, and AI workflow pages
- Express API server with typed OpenAPI contracts
- PostgreSQL persistence through Drizzle ORM
- Seven-agent healthcare orchestration model
- One-question-at-a-time intake
- Emergency signal detection and escalation
- Risk levels with plain-language explanations
- Downloadable-style report view
- Original project brief in `attached_assets/`
- Prompt and orchestration documentation in `docs/`

## Run locally

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

The Replit workflows start the API and web application with the required `PORT` and `BASE_PATH` values.

## Safety

MediGuide AI provides educational guidance only. It is not a diagnosis or a substitute for professional medical care. The consultation pauses normal intake when explicit emergency signals are detected and recommends immediate care.

## Project map

- `artifacts/mediguide-ai/` — frontend application
- `artifacts/api-server/` — API routes and orchestration logic
- `artifacts/api-server/src/lib/mediguide.ts` — agent definitions, intake rules, risk detection, summaries, reports
- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/db/src/schema/consultations.ts` — consultation persistence schema
- `docs/AI_ARCHITECTURE.md` — system architecture and agent contract
- `docs/PROMPTS.md` — prompts and prompt templates used for the assistant
- `attached_assets/Pasted-You-are-a-Senior-Full-Stack-Engineer-AI-Architect-Produ_1786009357501.txt` — original project brief