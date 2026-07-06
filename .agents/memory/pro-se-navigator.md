---
name: Pro Se Navigator
description: Key architecture decisions and gotchas for the Pro Se Litigation Navigator app
---

## Orval-generated hooks require `queryKey` in query options

TanStack Query v5 requires `queryKey` as non-optional in `UseQueryOptions`. The Orval-generated hooks enforce this at the type level. Always use the full pattern:

```tsx
useGetCase(id, { query: { enabled: !!id, queryKey: getGetCaseQueryKey(id) } })
```

Never use just `{ query: { enabled: ... } }` — TypeScript will reject it.

**Why:** Orval's generated `UseQueryOptions` type in this repo marks `queryKey` as required.

**How to apply:** Import the matching `getXxxQueryKey()` getter alongside every `useXxx()` hook call.

## Conversations table has `userId` column

The `conversations` table (from the OpenAI AI integration template) was modified to add a `userId: text("user_id").notNull()` column. This differs from the original template, which had no userId.

**Why:** Multi-user app needs to scope conversations per user.

**How to apply:** Any new code inserting into `conversationsTable` must include `userId`.

## SSE streaming: use raw fetch, not generated hooks

For streaming endpoints (`/api/cases/:id/complaint/generate`, `/api/research/:id/ask`, `/api/openai/conversations/:id/messages`), use raw `fetch` + `ReadableStream` on the frontend. The Orval-generated hooks do not support SSE.

**Why:** EventSource only supports GET; these are POST endpoints that stream.

## File uploads: use fetch + FormData

Evidence and court document uploads are multipart. Use native `fetch` + `FormData` directly. The generated hooks don't support multipart.

## multer in Express 5 with TypeScript

`req.params.id` in multer middleware handlers is typed `string | string[]` in some Express 5 + multer type combinations. Cast it: `parseInt(req.params.id as string)`.

## Default tasks seeded on case creation

When a new case is created (`POST /api/cases`), the server calls `seedDefaultTasks()` which inserts 20 (plaintiff) or 12 (defendant) default filing roadmap tasks. No manual seeding needed.

## Non-blocking AI analysis on uploads

Evidence and court document AI analysis runs async (fire-and-forget) after upload responds 201. The AI fills in `aiSummary`, `extractedDates`, etc. asynchronously. Frontend should refetch after a delay or use polling.
