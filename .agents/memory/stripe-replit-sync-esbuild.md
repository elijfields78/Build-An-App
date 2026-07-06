---
name: stripe-replit-sync esbuild external
description: stripe-replit-sync must be excluded from esbuild bundling or its DB migrations silently skip.
---

# stripe-replit-sync Must Be esbuild External

## Rule
Add `"stripe-replit-sync"` to the `external` array in `artifacts/api-server/build.mjs`.

**Why:** The package's `runMigrations()` reads 46+ SQL migration files from disk using `path.resolve(__dirname, "./migrations")`. When bundled by esbuild, `__dirname` resolves to the output `dist/` directory (not `node_modules/stripe-replit-sync/dist/`), so the migrations directory is not found. The function fails silently — logs "Migrations directory not found, skipping" internally — causing `stripe.accounts` and all other tables to never be created.

**Symptom:** Server logs "Stripe schema ready" but then fails with `relation "stripe.accounts" does not exist` when `findOrCreateManagedWebhook()` runs.

**How to apply:**
```js
// artifacts/api-server/build.mjs
external: [
  "*.node",
  "stripe-replit-sync",  // ← must be external
  ...
]
```
