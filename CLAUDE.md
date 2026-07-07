# Pro Se Navigator — Claude Code Project Guide

## Product identity

Pro Se Navigator is an AI-powered litigation support workspace for self-represented litigants. It helps users organize facts, evidence, timelines, deadlines, research, and educational draft documents.

The first monetizable wedge is **FCRA / credit reporting litigation support** for pro se users.

## Safety / compliance rules

This product must never present itself as a law firm, attorney, legal advice service, or attorney substitute.

Every AI-generated legal/procedural/document output must be framed as:

- legal information / education;
- organization and drafting support;
- a user-editable draft;
- not legal advice;
- not an attorney-client relationship;
- requiring user verification against court rules and facts;
- encouraging consultation with licensed counsel where possible.

Avoid unsafe phrasing:

- “you should file”
- “this will win”
- “guaranteed”
- “legal advice”
- “attorney-grade”
- “we represent you”

Prefer safer phrasing:

- “you may want to research”
- “possible issue to review”
- “draft for educational purposes”
- “verify against your jurisdiction’s rules”

## Architecture

- pnpm workspace monorepo
- Frontend: `artifacts/pro-se-navigator` — React, Vite, Tailwind, shadcn/ui, wouter
- API: `artifacts/api-server` — Express 5, Clerk auth, routes under `src/routes`
- DB: `lib/db` — PostgreSQL + Drizzle ORM
- API contracts: `lib/api-spec/openapi.yaml`
- Generated client: `lib/api-client-react/src/generated`

## Commands

Use pnpm only.

- Install: `pnpm install`
- Typecheck: `pnpm run typecheck`
- Build: `pnpm run build`
- API dev: `pnpm --filter @workspace/api-server run dev`
- Frontend dev: `pnpm --filter @workspace/pro-se-navigator run dev`
- Codegen after OpenAPI change: `pnpm --filter @workspace/api-spec run codegen`
- DB schema push after Drizzle schema change: `pnpm --filter @workspace/db run push`

In this Hermes environment, pnpm is at `/opt/data/.npm-global/bin/pnpm`; use that path or add `/opt/data/.npm-global/bin` to PATH.

## Important conventions

- Contract-first API: update `lib/api-spec/openapi.yaml` before API/client changes.
- Run codegen after changing OpenAPI.
- SSE endpoints use raw `fetch`, not generated hooks.
- Multipart file uploads use native `fetch` + `FormData`, not generated hooks.
- Keep multi-user scoping by `userId`.
- Do not log secrets or user legal documents.
- Do not put API keys in source files.

## MVP priority

Prioritize FCRA/credit reporting workflow:

1. landing/waitlist/pricing clarity;
2. FCRA case intake;
3. timeline builder;
4. evidence vault;
5. missing information checklist;
6. dispute letter / CFPB complaint / demand letter educational drafts;
7. Perplexity-style research with citations;
8. subscription and affiliate readiness.

Delay universal litigation coverage, appeals, PACER, docket monitoring, and advanced case law systems until after usage/revenue signal.
