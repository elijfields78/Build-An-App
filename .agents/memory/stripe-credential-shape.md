---
name: Stripe credential proxy shape
description: The Replit connectors proxy returns Stripe credentials under a different key than expected — critical for fetching live keys at runtime.
---

# Stripe Credential Proxy Shape

## Rule
When fetching Stripe credentials from `https://${REPLIT_CONNECTORS_HOSTNAME}/api/v2/connection?include_secrets=true&connector_names=stripe`, the secret key is at `items[0].settings.secret`, NOT `items[0].settings.secret_key`.

**Why:** The Replit Stripe connector stores keys under field names matching their Stripe dashboard labels (`secret`, `publishable`), not generic names.

**How to apply:** In `stripeClient.ts` (or any credential-fetching code), look for `settings.secret`:
```ts
const data = await resp.json() as { items?: Array<{ settings?: { secret?: string; publishable?: string } }> };
if (!settings?.secret) throw new Error("...");
return { secretKey: settings.secret };
```

Also: the auth header must be `"X-Replit-Token"` (hyphen-separated), not `"X_REPLIT_TOKEN"` (underscore).

The token value comes from `process.env.REPL_IDENTITY` prefixed with `"repl "`, or `process.env.WEB_REPL_RENEWAL` prefixed with `"depl "`.
