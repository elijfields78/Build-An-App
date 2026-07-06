import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { useEffect, useRef } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Pages
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import NewCase from "@/pages/cases/new";
import CaseHome from "@/pages/cases/[id]";
import CaseStory from "@/pages/cases/[id]/story";
import CaseEvidence from "@/pages/cases/[id]/evidence";
import CaseJurisdiction from "@/pages/cases/[id]/jurisdiction";
import CaseIfp from "@/pages/cases/[id]/ifp";
import CaseComplaint from "@/pages/cases/[id]/complaint";
import CaseCourtDocuments from "@/pages/cases/[id]/court-documents";
import CaseTasks from "@/pages/cases/[id]/tasks";
import LegalResearch from "@/pages/research";
import AiAssistant from "@/pages/assistant";
import Pricing from "@/pages/pricing";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if (error && typeof error === "object" && "status" in error) {
          const status = (error as { status: number }).status;
          if (status === 401 || status === 403 || status === 404) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

/**
 * Syncs Clerk's session token into the custom-fetch layer so every generated
 * API hook sends  Authorization: Bearer <token>  on every request.
 *
 * Must live inside <ClerkProvider> and <QueryClientProvider>.
 */
function ClerkAuthTokenSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ProtectedRoute({ component: Component, ...rest }: { component: any, path: string }) {
  return (
    <Route {...rest}>
      {(params) => (
        <>
          <Show when="signed-in">
            <Component params={params} />
          </Show>
          <Show when="signed-out">
            <Redirect to="/sign-in" />
          </Show>
        </>
      )}
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/cases/new" component={NewCase} />
      <ProtectedRoute path="/cases/:id" component={CaseHome} />
      <ProtectedRoute path="/cases/:id/story" component={CaseStory} />
      <ProtectedRoute path="/cases/:id/evidence" component={CaseEvidence} />
      <ProtectedRoute path="/cases/:id/jurisdiction" component={CaseJurisdiction} />
      <ProtectedRoute path="/cases/:id/ifp" component={CaseIfp} />
      <ProtectedRoute path="/cases/:id/complaint" component={CaseComplaint} />
      <ProtectedRoute path="/cases/:id/court-documents" component={CaseCourtDocuments} />
      <ProtectedRoute path="/cases/:id/tasks" component={CaseTasks} />
      
      <ProtectedRoute path="/research" component={LegalResearch} />
      <ProtectedRoute path="/assistant" component={AiAssistant} />
      <ProtectedRoute path="/pricing" component={Pricing} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkAuthTokenSync />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
