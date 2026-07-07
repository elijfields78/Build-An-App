# Pro Se Navigator Build Plan

## Current repo state

The repo is a pnpm monorepo generated/built in Replit.

Stack:

- Frontend: React + Vite + Tailwind + shadcn/ui + wouter
- API: Express 5 + Clerk auth
- Database: PostgreSQL + Drizzle ORM
- API contract: OpenAPI + Orval-generated React Query client
- AI: OpenAI integration package already present
- Billing: Stripe + stripe-replit-sync packages present

Existing product areas according to `replit.md` and files:

- Dashboard
- Case Management
- Story Builder
- Evidence Center
- Jurisdiction Analyzer
- Fee Waiver / IFP
- Complaint Generator
- Court Document Scanner
- Filing Roadmap
- Legal Research
- AI Assistant
- Pricing/Billing components

## Immediate technical notes

- `pnpm` was not installed globally; installed locally at `/opt/data/.npm-global/bin/pnpm`.
- `pnpm install --frozen-lockfile` downloaded dependencies but exited with `ERR_PNPM_IGNORED_BUILDS` because pnpm blocked `esbuild` build scripts.
- Next baseline step: approve or configure build scripts for `esbuild`, then run typecheck/build.

## Product focus

Founder directive: do **not** narrow Pro Se Navigator into only FCRA / credit reporting. FCRA can remain an important vertical and monetization lane, but the product vision is broader:

> a highly functional, multi-service AI litigation operating system for self-represented litigants.

The app should preserve and deepen all existing modules while making the broad system coherent, safe, memory-driven, and agentic. See `PRO_SE_NAVIGATOR_FULL_VISION_MASTER_PLAN.md`.

## First implementation tickets

### Ticket 1 — Safety/disclaimer layer

Add reusable disclaimer component and ensure AI/document generation pages display it.

Required language:

- Pro Se Navigator is not a law firm.
- It does not provide legal advice.
- No attorney-client relationship is created.
- Outputs are educational drafts and organizational support.
- Users must verify all facts, deadlines, and court rules.

### Ticket 2 — FCRA workspace mode

Add a clear FCRA / credit reporting case type path:

- case type: credit reporting / FCRA
- bureaus involved
- furnishers involved
- dispute dates
- response dates
- CFPB complaint status
- damages/evidence checklist

### Ticket 3 — Missing information checklist

Generate a structured missing-information report for FCRA cases:

- missing dispute letters
- missing bureau response
- missing credit report copy
- missing proof of mailing
- missing damages evidence
- missing timeline events

### Ticket 4 — Educational draft generator hardening

Ensure dispute letter, CFPB complaint, demand letter, complaint outline pages:

- call outputs drafts;
- display safety disclaimer;
- ask user to verify;
- avoid definitive legal instructions.

### Ticket 5 — Landing/pricing conversion pass

Reposition public copy around:

- organize your credit reporting dispute;
- build your timeline;
- manage evidence;
- generate educational drafts;
- not legal advice.

## Revenue path

First paid offer:

- Free: basic intake/timeline preview
- Pro: $49/month for AI drafts + evidence/timeline workspace
- Founding Access: $97 one-time early user offer

Affiliate plan:

- 30% recurring commission
- custom landing pages later
- start manually with coupon/referral code if needed

## Next build steps

1. Get baseline build/typecheck passing.
2. Add safety/disclaimer component.
3. Audit AI output pages for compliance phrasing.
4. Add FCRA-specific intake fields if not already present.
5. Build missing-info checklist.
6. Create first launch landing page section.
