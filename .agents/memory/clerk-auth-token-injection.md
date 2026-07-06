---
name: Clerk auth token injection for generated API hooks
description: Why all API calls returned 401 in Replit preview and how to fix it permanently
---

## The problem
In Replit's proxied/iframe preview environment, Clerk session cookies are NOT reliably forwarded to the API server. The generated Orval hooks (via `customFetch` in `lib/api-client-react/src/custom-fetch.ts`) rely on cookies by default, causing every API call to return 401 even when the user is signed in.

## The fix
`custom-fetch.ts` already has a `setAuthTokenGetter` mechanism. Wire it to Clerk's `useAuth().getToken()` inside a component that lives inside `<ClerkProvider>`:

```tsx
// In App.tsx, inside ClerkProvider + QueryClientProvider:
function ClerkAuthTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}
```

Import `setAuthTokenGetter` from `@workspace/api-client-react` and `useAuth` from `@clerk/react`.

**Why:** `customFetch` checks `_authTokenGetter` before every request and adds `Authorization: Bearer <token>` when set. This works even where cookies fail.

**Where:** `ClerkAuthTokenSync` is rendered inside `<QueryClientProvider>` (but after `<ClerkProvider>`) in `App.tsx`.

## Side effects / notes
- Raw `fetch` calls (SSE streaming, file uploads) must add the Authorization header manually: `const token = await getToken(); fetch(url, { headers: { Authorization: \`Bearer \${token}\` } })`
- The `clerkMiddleware` on the backend reads Bearer tokens automatically — no backend changes needed.
- Also configure `QueryClient` to not retry on 401/403/404 to avoid hammering the API on auth errors.
