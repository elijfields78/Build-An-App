import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { useEffect, useRef, createContext, useContext, useState } from "react";
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
import CaseDisputeLetter from "@/pages/cases/[id]/dispute-letter";
import CaseAdministrativeProcess from "@/pages/cases/[id]/administrative";
import CaseLawBank from "@/pages/cases/[id]/case-law";
import CaseDocketDeadlines from "@/pages/cases/[id]/deadlines";
import CaseMemory from "@/pages/cases/[id]/memory";
import ProceduralRiskEngine from "@/pages/cases/[id]/procedural-risk";
import SettlementLeverageCenter from "@/pages/cases/[id]/settlement";
import DraftReviewCenter from "@/pages/cases/[id]/draft-review";
import AgentOrchestrator from "@/pages/cases/[id]/agents";
import LegalPlaybookCenter from "@/pages/cases/[id]/playbooks";
import LitigationTimeline from "@/pages/cases/[id]/timeline";
import DocumentAssemblyCenter from "@/pages/cases/[id]/documents";
import ServiceDefaultCenter from "@/pages/cases/[id]/service";
import LegalResearch from "@/pages/research";
import AiAssistant from "@/pages/assistant";
import Pricing from "@/pages/pricing";
import Affiliates from "@/pages/affiliates";

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

type Theme = "dark" | "light"
type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "theme",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}

/**
 * Syncs Clerk's session token into the custom-fetch layer so every generated
 * API hook sends  Authorization: Bearer <token>  on every request.
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
      <ProtectedRoute path="/cases/:id/dispute-letter" component={CaseDisputeLetter} />
      <ProtectedRoute path="/cases/:id/administrative" component={CaseAdministrativeProcess} />
      <ProtectedRoute path="/cases/:id/case-law" component={CaseLawBank} />
      <ProtectedRoute path="/cases/:id/deadlines" component={CaseDocketDeadlines} />
      <ProtectedRoute path="/cases/:id/memory" component={CaseMemory} />
      <ProtectedRoute path="/cases/:id/procedural-risk" component={ProceduralRiskEngine} />
      <ProtectedRoute path="/cases/:id/settlement" component={SettlementLeverageCenter} />
      <ProtectedRoute path="/cases/:id/draft-review" component={DraftReviewCenter} />
      <ProtectedRoute path="/cases/:id/agents" component={AgentOrchestrator} />
      <ProtectedRoute path="/cases/:id/playbooks" component={LegalPlaybookCenter} />
      <ProtectedRoute path="/cases/:id/timeline" component={LitigationTimeline} />
      <ProtectedRoute path="/cases/:id/documents" component={DocumentAssemblyCenter} />
      <ProtectedRoute path="/cases/:id/service" component={ServiceDefaultCenter} />
      
      <ProtectedRoute path="/research" component={LegalResearch} />
      <ProtectedRoute path="/assistant" component={AiAssistant} />
      <ProtectedRoute path="/pricing" component={Pricing} />
      <ProtectedRoute path="/affiliates" component={Affiliates} />
      
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
    <ThemeProvider defaultTheme="dark">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;