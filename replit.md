# Pro Se Litigation Navigator

An AI-powered legal command center for pro se litigants — people representing themselves in civil court. Helps users manage cases, build their story, upload evidence, analyze jurisdiction, draft complaints, scan court documents, and conduct legal research with AI assistance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/pro-se-navigator run dev` — run the frontend (Vite, port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth (`@clerk/express`)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter routing
- Auth: Clerk (React + Express), Clerk proxy at `/api/__clerk`
- AI: OpenAI via Replit AI Integration (`@workspace/integrations-openai-ai-server`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `lib/db/src/schema/` — Drizzle schema files (cases, evidence, analysis, tasks, research, conversations, messages)
- `artifacts/api-server/src/routes/` — Express route handlers (cases, dashboard, research, openai)
- `artifacts/pro-se-navigator/src/pages/` — React page components
- `artifacts/api-server/uploads/` — uploaded files (evidence, court documents)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks. Never manually write fetch calls (except SSE streaming and file uploads).
- Clerk proxy at `/api/__clerk` enables auth on Replit's proxied domain without CNAME setup.
- SSE streaming (raw fetch + ReadableStream, NOT EventSource) for: complaint generation, legal research answers, AI assistant messages.
- File uploads via native `fetch` + `FormData` (multer on the server); files stored to `artifacts/api-server/uploads/`.
- AI analysis is non-blocking on uploads: evidence and court document AI analysis runs async after the upload responds.
- Default filing tasks are seeded automatically when a new case is created (20 tasks for plaintiff, 12 for defendant).
- `conversations` table has a `userId` column (differs from the original template which omitted it).

## Product

- **Dashboard** — case overview, stats, upcoming tasks
- **Case Management** — create/edit/delete cases; case home shows progress and readiness
- **Story Builder** — structured fact intake (who, what, when, where, damages, remedy) with AI summary
- **Evidence Center** — file upload with async AI analysis (dates, names, key facts extracted)
- **Jurisdiction Analyzer** — federal vs state questionnaire with AI legal analysis
- **Fee Waiver (IFP)** — AO-239/AO-240 questionnaire (in forma pauperis)
- **Complaint Generator** — AI-drafted verified complaint via SSE streaming
- **Court Document Scanner** — upload received documents, AI explains what they mean and what to do next
- **Filing Roadmap** — phase-based task checklist with completion tracking
- **Legal Research** — Perplexity-style AI research with citation-quality answers
- **AI Assistant** — general legal Q&A chat

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema changes in `lib/db/src/schema/`
- Run `pnpm --filter @workspace/api-spec run codegen` after any changes to `lib/api-spec/openapi.yaml`
- The `conversations` table includes `userId` (unlike the base template) — required for multi-user scoping
- SSE endpoints must use raw `fetch` on the frontend, not the generated hooks (hooks don't support streaming)
- File upload hooks from Orval don't support multipart — use native `fetch` + `FormData` directly

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
