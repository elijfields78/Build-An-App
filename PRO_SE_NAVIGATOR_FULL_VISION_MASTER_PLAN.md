# Pro Se Navigator — Full Vision Master Build Plan

Owner: Eli Fields + Hermes + Claude Code
Last updated: July 2026

## Founder directive

Eli does **not** want Pro Se Navigator reduced to one narrow product such as FCRA-only credit litigation. The FCRA/credit reporting workflow can be a strong vertical and revenue lane, but the product vision is broader:

> Pro Se Navigator is a highly functional, multi-service AI litigation operating system for self-represented litigants.

The app should support different users with different litigation needs — “different strokes for different folks” — while maintaining a unified command-center experience.

## North star

Build the closest possible equivalent of a “Perplexity Computer for pro se litigation”: a multi-agent, memory-rich, research-capable, document-aware litigation support system that helps users organize, understand, draft, research, and manage their cases.

Not a law firm. Not legal advice. Not an attorney substitute.

A litigation support OS.

## Product thesis

Pro se litigants need more than a chatbot. They need a structured system that can coordinate:

- case memory;
- evidence memory;
- timeline memory;
- document drafting;
- research with citations;
- procedural education;
- deadline tracking;
- issue spotting;
- strategy education;
- court document interpretation;
- next-step planning.

The product should feel like a command center where multiple specialized AI agents work together on the user’s litigation project.

## Core verticals to support

The product should ultimately support:

1. Credit reporting / FCRA litigation
2. Debt collection defense
3. Small claims
4. Contract disputes
5. Landlord-tenant matters
6. Civil rights / §1983 education support
7. Consumer protection
8. Appeals preparation
9. General civil procedure support
10. Court document interpretation
11. Discovery support
12. Motion response support
13. IFP / fee waiver support
14. Evidence and exhibit organization

## Do not remove existing broad modules

Existing repo modules should be preserved and improved:

- Dashboard
- Case Management
- Story Builder
- Evidence Center
- Jurisdiction Analyzer
- IFP / Fee Waiver
- Dispute Letter
- Complaint Generator
- Court Document Scanner
- Filing Roadmap
- Legal Research
- AI Assistant
- Pricing/Billing

The strategy is not to delete broad features. The strategy is to make the broad system more coherent, safer, deeper, and more agentic.

## Product architecture: litigation workspace + agent team

Each case should become a workspace with persistent memory.

### Case workspace memory

For every case, store:

- user goals;
- parties;
- jurisdiction;
- court;
- claims/issues;
- timeline;
- damages;
- evidence inventory;
- filed documents;
- received court documents;
- deadlines;
- draft documents;
- research sessions;
- AI analysis summaries;
- user notes;
- procedural posture.

### Agent team concept

The app should eventually coordinate specialized agents:

| Agent | Job |
|---|---|
| Intake Agent | Organizes facts, parties, dates, harms, desired outcome |
| Timeline Agent | Builds chronological event map from facts/evidence |
| Evidence Agent | Extracts names, dates, facts, contradictions, exhibit candidates |
| Research Agent | Uses Perplexity-style cited research and legal information retrieval |
| Procedure Agent | Explains process, rules, deadlines, court steps, local-rule caveats |
| Drafting Agent | Creates educational drafts/templates from structured facts |
| Review Agent | Checks drafts for missing elements, clarity, unsafe claims, unsupported facts |
| Deadline Agent | Tracks user-entered deadlines and warns about missing dates |
| Strategy Education Agent | Explains common litigation events and possible options to research |
| Compliance Agent | Adds disclaimers, blocks legal-advice phrasing, warns about verification |

## Perplexity Computer ideology

Eli’s litigation workflow uses Perplexity Computer because it offers deep research, multi-agent assistance, memory, and the feeling of a research workspace.

Pro Se Navigator should borrow that ideology:

1. **Research-first answers** — cited, source-aware, not generic.
2. **Multi-step investigation** — the system should break a task into subtasks.
3. **Persistent memory** — the app remembers the user’s case facts, documents, timeline, and prior outputs.
4. **Agent routing** — different agents handle research, drafting, review, evidence, deadlines.
5. **Workspace continuity** — every answer should know what case it belongs to.
6. **Source grounding** — research answers should show sources and confidence level.
7. **Task orientation** — outputs should produce next steps, checklists, draft documents, and missing-info lists.

## AI provider routing

| Capability | Preferred provider |
|---|---|
| Deep web/legal research with citations | Perplexity API |
| Structured drafting / JSON outputs | OpenAI |
| Long-context reasoning over case memory/docs | Anthropic |
| Fast UI assistant | OpenAI or Anthropic |
| Multi-agent orchestration | App-level orchestrator that routes to providers |
| Evidence/document retrieval | embeddings + vector search later |

Do not hard-code the app to one provider. Build an AI provider abstraction layer.

## Proposed AI backend modules

Create backend services/modules:

- `ai/providerRouter.ts`
- `ai/prompts/systemPrompts.ts`
- `ai/agents/intakeAgent.ts`
- `ai/agents/timelineAgent.ts`
- `ai/agents/evidenceAgent.ts`
- `ai/agents/researchAgent.ts`
- `ai/agents/draftingAgent.ts`
- `ai/agents/reviewAgent.ts`
- `ai/agents/complianceAgent.ts`
- `ai/memory/caseMemoryService.ts`
- `ai/research/perplexityClient.ts`
- `ai/research/sourceNormalizer.ts`

## Memory architecture

### Phase 1 memory

Use PostgreSQL structured tables:

- cases
- case stories
- evidence
- tasks
- research sessions
- conversations
- messages
- analysis outputs

Add summary fields:

- `caseSummary`
- `proceduralPosture`
- `keyFacts`
- `keyDeadlines`
- `knownClaims`
- `missingInformation`

### Phase 2 memory

Add document embeddings / vector search:

- credit reports;
- PDFs;
- emails;
- court filings;
- exhibits;
- screenshots OCR;
- research snippets.

### Phase 3 memory

Add user-level litigation profile:

- common case types;
- preferred courts;
- drafting tone;
- saved research;
- recurring parties/entities;
- educator/community source;
- subscription/affiliate attribution.

## Safety requirements

The broader the product, the more important safety becomes.

Every agent must follow:

- not a law firm;
- not legal advice;
- no attorney-client relationship;
- educational/drafting/organizational support only;
- user must verify jurisdiction, rules, facts, deadlines;
- encourage licensed counsel/legal aid when possible;
- no guarantees;
- no instructions to evade law or abuse process;
- no definitive “you should file X” unless framed as an educational possibility to research.

## Order of operations

### Phase 0 — Stabilize codebase

1. Get pnpm install/build/typecheck working.
2. Fix any obvious TypeScript/runtime errors.
3. Confirm Replit dev workflow works.
4. Confirm API server + frontend can run.
5. Confirm Clerk auth and DB expectations.

### Phase 1 — Safety + coherence layer

1. Add reusable legal safety disclaimer component.
2. Add AI output safety footer.
3. Add product-wide “Legal information, not legal advice” UX.
4. Create unified case workspace concept.
5. Ensure navigation clearly explains modules.

### Phase 2 — Case memory foundation

1. Build case memory service.
2. Add case summary / procedural posture fields if missing.
3. Connect story, evidence, research, documents, tasks to case context.
4. Make AI assistant case-aware.
5. Make research sessions optionally case-aware.

### Phase 3 — Agentic research system

1. Add Perplexity API client.
2. Add research provider routing.
3. Return cited research answers.
4. Save sources to DB.
5. Add confidence / jurisdiction warning.
6. Add “send to case memory” action.

### Phase 4 — Multi-agent workflow orchestration

Build orchestrated flows:

- “Analyze my case” → intake + timeline + missing info + evidence + next-step education.
- “Review this court document” → document scanner + procedure + deadline + response options.
- “Draft complaint” → case memory + drafting + review + compliance.
- “Prepare for motion to dismiss” → research + procedure + evidence + response outline.
- “Build discovery plan” → issue list + document requests + interrogatories + evidence gaps.

### Phase 5 — Vertical playbooks

Add structured playbooks for each vertical:

1. FCRA / credit reporting
2. Debt collection defense
3. Small claims
4. Landlord-tenant
5. Contract disputes
6. Civil rights / §1983 education
7. Appeals

Each playbook includes:

- intake fields;
- evidence checklist;
- timeline events;
- common procedural events;
- draft document types;
- research starting points;
- safety caveats.

### Phase 6 — Monetization and affiliate system

1. Stripe plans.
2. Usage limits by tier.
3. Educator affiliate tracking.
4. Custom referral links.
5. Landing pages per community/educator later.
6. Admin metrics.

## Immediate build priority

Eli wants a full-featured masterpiece, not a narrowed MVP. So the immediate build priority is:

> Make the existing broad app coherent, safe, memory-driven, and agent-ready.

First code implementation should be:

1. legal safety/disclaimer system;
2. case-aware AI memory foundation;
3. AI provider abstraction with future Perplexity/Anthropic/OpenAI routing;
4. improve research route into a Perplexity-style cited research system.

## Success criteria

The app should eventually feel like:

- Notion for litigation organization;
- Perplexity for legal research;
- Cursor/Claude Code for document drafting and reasoning;
- Linear for case tasks/deadlines;
- Stripe/OpenAI-level polish.

The user should feel:

> “This system understands my case, remembers my facts, helps me research deeply, organizes my evidence, drafts educational documents, and tells me what I need to verify next.”
