# Pro Se Navigator — Agentic Architecture Order of Operations

This file records the technical implementation sequence recommended after repo inspection and Claude Code architecture analysis.

## Current AI state

Current AI calls are inline in route files:

- `artifacts/api-server/src/routes/cases.ts`
  - evidence analysis
  - jurisdiction suggestions
  - complaint generation SSE
  - dispute-letter generation SSE
- `artifacts/api-server/src/routes/research.ts`
  - legal research SSE
- `artifacts/api-server/src/routes/openai.ts`
  - general AI assistant SSE

The app already has many modules, but it does **not** yet have:

- AI provider abstraction;
- Perplexity client;
- Anthropic client;
- agent modules;
- unified case memory service;
- source/citation normalization;
- orchestrated multi-agent case analysis endpoint.

## Technical principle

Do not build one generic legal chatbot.

Build a case-aware, memory-driven, multi-agent litigation workspace.

## Where to build

Add app-specific AI orchestration inside:

```text
artifacts/api-server/src/ai/
```

Recommended files:

```text
artifacts/api-server/src/ai/providerRouter.ts
artifacts/api-server/src/ai/compliance.ts
artifacts/api-server/src/ai/prompts/systemPrompts.ts
artifacts/api-server/src/ai/memory/caseMemoryService.ts
artifacts/api-server/src/ai/agents/intakeAgent.ts
artifacts/api-server/src/ai/agents/timelineAgent.ts
artifacts/api-server/src/ai/agents/evidenceAgent.ts
artifacts/api-server/src/ai/agents/researchAgent.ts
artifacts/api-server/src/ai/agents/draftingAgent.ts
artifacts/api-server/src/ai/agents/reviewAgent.ts
artifacts/api-server/src/ai/research/perplexityClient.ts
artifacts/api-server/src/ai/research/sourceNormalizer.ts
```

## Phase 0 — Extract current AI into architecture without changing behavior

Goal: create the bones of the agent system without breaking existing product flows.

Tasks:

1. Create `providerRouter.ts` wrapping current OpenAI client.
2. Create `systemPrompts.ts` and move existing prompt strings there.
3. Create `compliance.ts` with standard safety/disclaimer footer.
4. Update route files to call `providerRouter` instead of direct OpenAI SDK calls.
5. Preserve streaming behavior.

This is the safest first implementation ticket.

## Phase 1 — Case memory foundation

Goal: every AI feature should understand the case workspace.

Tasks:

1. Add case memory columns if needed:
   - `caseSummary`
   - `proceduralPosture`
   - `keyFacts`
   - `keyDeadlines`
   - `knownClaims`
   - `missingInformation`
2. Create `caseMemoryService.ts` that gathers:
   - case
   - story
   - evidence
   - jurisdiction analysis
   - tasks
   - research sessions
   - recent AI summaries
3. Make AI assistant optionally case-aware.
4. Make legal research sessions use `caseId` context when available.

## Phase 2 — Agent modules

Goal: convert current prompts into specialized agents.

Agents:

- Intake Agent
- Timeline Agent
- Evidence Agent
- Research Agent
- Drafting Agent
- Review Agent
- Compliance Agent

Each agent should:

- accept case context;
- accept task/user input;
- call provider router;
- return structured or streamed output;
- include safety constraints.

## Phase 3 — First visible multi-agent workflow

Add endpoint:

```text
POST /cases/{id}/analyze
```

This should run:

1. Intake Agent
2. Timeline Agent
3. Evidence Agent
4. Missing Info Agent
5. Compliance Agent

Output should stream progress events, not just one answer.

Example user-facing feature:

> Analyze my case

Returns:

- case summary;
- timeline;
- key facts;
- missing evidence;
- procedural questions to verify;
- possible next areas to research;
- safety disclaimer.

## Phase 4 — Perplexity-style cited research

Goal: make research feel like Perplexity Computer.

Tasks:

1. Add `PERPLEXITY_API_KEY` to Replit Secrets.
2. Build `perplexityClient.ts`.
3. Build `sourceNormalizer.ts`.
4. Update `researchAgent` to use Perplexity for cited research.
5. Store sources/citations in DB.
6. Update frontend research page to render citations.
7. Let user send useful research findings into case memory.

## Phase 5 — Multi-provider routing

Add Anthropic/OpenAI/Perplexity routing by task:

| Task | Provider |
|---|---|
| cited legal research | Perplexity |
| structured drafts | OpenAI |
| long case reasoning | Anthropic |
| quick assistant chat | OpenAI/Anthropic |
| compliance review | OpenAI/Anthropic |

## Phase 6 — Vertical playbooks

Build structured playbooks for:

- FCRA / credit reporting
- debt collection defense
- small claims
- landlord-tenant
- contract disputes
- civil rights / §1983 education
- appeals

Each playbook should define:

- intake fields;
- evidence checklist;
- timeline events;
- draft documents;
- research prompts;
- procedural caveats;
- disclaimers.

## Immediate first code ticket

Start with Phase 0:

> Extract provider router, prompt registry, and compliance footer while preserving existing behavior.

This does not narrow the product. It makes the current broad product ready for Perplexity-style multi-agent growth.
