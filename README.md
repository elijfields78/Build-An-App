# Pro Se Litigation Navigator

An AI-powered legal command center for people representing themselves in civil court — built so a self-represented litigant can manage an entire case from intake to resolution without a lawyer.

---

## What it does

| Module | Description |
|--------|-------------|
| **Dashboard** | Case overview, filing readiness gauge, live deadline countdown, activity feed |
| **Story Builder** | Structured fact intake (who, what, when, where, damages, remedy) with AI summary |
| **Evidence Center** | File upload with async AI analysis — dates, names, key facts extracted automatically |
| **Timeline** | Chronological event log for building the factual record |
| **Case Memory** | Free-form notes and structured data that persists across every module |
| **Jurisdiction Analyzer** | Federal vs. state questionnaire with AI legal analysis |
| **Procedural Risk Engine** | Opposing-counsel attack map — 8 procedural defenses pre-loaded |
| **IFP (Fee Waiver)** | AO-239/AO-240 questionnaire (in forma pauperis) |
| **Complaint Generator** | AI-drafted verified complaint via SSE streaming |
| **Draft Review** | AI preflight check for unsupported claims and citation risk |
| **Document Packets** | Assembly center for court-ready document packets |
| **Court Document Scanner** | Upload received court documents; AI explains them and recommends next steps |
| **Docket & Deadlines** | Deadline tracker with phase-based task checklist (20 tasks seeded on creation) |
| **Letters & Dispute** | Demand letters, FCRA/FDCPA dispute letter generator |
| **Administrative Process** | Notice/cure/escalation record builder |
| **Case Law Bank** | Authority tracker — verified vs. research-lead citations |
| **Settlement Leverage** | Pressure-point analysis and damages proof tracker |
| **Legal Playbooks** | Pre-built strategic guides for common case types |
| **Agent Orchestrator** | Multi-agent workflow panel (Procedure, Evidence, Draft Review, Settlement agents) |
| **Legal Research** | Perplexity-style AI research with citation-quality answers |
| **AI Assistant** | General legal Q&A chat with full conversation history |
| **Pricing** | Stripe-gated Free / Pro / Attorney tiers |
| **Affiliates** | Affiliate tracking and referral dashboard |

---

## Stack

- **Runtime**: Node.js 24, pnpm workspaces, TypeScript 5.9
- **API**: Express 5 + Clerk auth (`@clerk/express`)
- **DB**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter routing
- **Auth**: Clerk (React + Express), proxied at `/api/__clerk`
- **AI**: OpenAI via Replit AI Integration (SSE streaming for long responses)
- **Validation**: Zod v4, drizzle-zod
- **Payments**: Stripe (Free / Pro / Attorney tiers, webhook-driven tier updates)
- **API codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)

---

## Project structure

```
artifacts/
  api-server/       → Express API (port 8080, proxied at /api)
  pro-se-navigator/ → React + Vite frontend
lib/
  api-spec/         → OpenAPI spec (source of truth)
  api-client-react/ → Generated React Query hooks + Zod schemas
  db/               → PostgreSQL schema (Drizzle ORM)
scripts/            → Developer utility scripts
```

---

## Running locally

```bash
# Install dependencies
pnpm install

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend
pnpm --filter @workspace/pro-se-navigator run dev

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Regenerate API hooks after editing openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Type-check everything
pnpm run typecheck
```

**Required environment variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope (for `pnpm run push`) |

---

## Pushing to GitHub

```bash
pnpm run push
```

This stages all changes, creates a timestamped commit, and pushes to `main`.

---

## Architecture notes

- **Contract-first API**: Edit `lib/api-spec/openapi.yaml` → run codegen → use generated hooks. Never write fetch calls manually (except SSE and file uploads).
- **SSE streaming**: Raw `fetch` + `ReadableStream` on the client, **not** `EventSource`. Used for complaint generation, legal research, and AI assistant.
- **File uploads**: Native `fetch` + `FormData` (multer on server). Files stored in `artifacts/api-server/uploads/`.
- **AI analysis is non-blocking**: Evidence and court-doc analysis runs async after the upload returns.
- **Default tasks seeded on case creation**: 20 tasks for plaintiff, 12 for defendant.
- **Clerk proxy**: Enables Clerk auth on Replit's proxied domain without custom CNAME.

---

## Legal disclaimer

This application is legal-information support, not legal advice. Users must verify all rules, local court rules, and court orders. Consult a licensed attorney or legal aid organization where possible.
