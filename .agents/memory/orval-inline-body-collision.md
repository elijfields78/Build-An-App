---
name: Orval inline requestBody naming collision
description: Why inline OpenAPI requestBody schemas cause TS2308 in the api-zod barrel, and how to fix it.
---

In this Orval split-mode Zod setup (`lib/api-zod`), the barrel `index.ts` does:
```ts
export * from "./generated/api";
export * from "./generated/types";
```

When an endpoint uses an **inline** requestBody schema (not a `$ref`), Orval generates:
1. A Zod const in `api.ts` named after the operation (e.g. `GenerateDisputeLetterBody`)
2. A TypeScript type alias in `types/<name>.ts` with the SAME derived name

Both exports collide → TypeScript TS2308 "already exported a member".

When an endpoint uses `$ref: "#/components/schemas/Foo"`, Orval generates:
- `api.ts`: operation-derived Zod const (e.g. `GenerateDisputeLetterBody`) — inline validation, not named after the schema
- `types/foo.ts`: TypeScript type `Foo` — a DIFFERENT name → no collision

**Fix:** Always use `$ref` to a named component schema for requestBody schemas in this project's OpenAPI spec. Add the schema to `#/components/schemas` and reference it.

**Why:** Orval's split-mode Zod generation produces both a Zod const (operation-derived name) and a TS type (schema-derived name). With `$ref`, these are different names. With inline schemas, they're the same.

**How to apply:** Any new POST/PUT endpoint with a request body → define the body schema in `#/components/schemas` first, then reference with `$ref`. Never use inline object schemas in requestBody.
