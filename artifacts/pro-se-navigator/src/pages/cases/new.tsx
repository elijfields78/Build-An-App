import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useCreateCase } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, CalendarClock, CheckCircle2, FileText, Gavel, Home, Landmark, LibraryBig, Scale, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

type CasePosture = "plaintiff" | "defendant" | "research";
type MatterType = "fcra" | "fdcpa" | "landlordTenant" | "contract" | "civilRights" | "smallClaims" | "appeals" | "generalCivil";
type CourtSystem = "federal" | "state" | "smallClaims" | "administrative" | "unknown";
type Urgency = "planning" | "activeDeadline" | "servedOrSued" | "postJudgment";

type WizardState = {
  title: string;
  caseType: CasePosture;
  matterType: MatterType;
  courtSystem: CourtSystem;
  urgency: Urgency;
  opposingParty: string;
  court: string;
  importantDate: string;
  summary: string;
};

const defaultState: WizardState = {
  title: "",
  caseType: "plaintiff",
  matterType: "generalCivil",
  courtSystem: "unknown",
  urgency: "planning",
  opposingParty: "",
  court: "",
  importantDate: "",
  summary: "",
};

const postureOptions = [
  { value: "plaintiff", title: "Potential plaintiff", copy: "I may bring claims, send demands, or file a complaint.", icon: Gavel },
  { value: "defendant", title: "Defendant / respondent", copy: "I was sued, served, contacted, or need to respond.", icon: ShieldCheck },
  { value: "research", title: "Research / planning", copy: "I am organizing facts, studying options, or preparing strategy.", icon: Sparkles },
] satisfies Array<{ value: CasePosture; title: string; copy: string; icon: typeof Gavel }>;

const matterOptions = [
  { value: "fcra", title: "FCRA / credit reporting", copy: "Bureaus, furnishers, disputes, CFPB, credit-report harm.", icon: WalletCards },
  { value: "fdcpa", title: "FDCPA / debt collection", copy: "Collectors, debt buyers, validation, collection lawsuit defense.", icon: Building2 },
  { value: "landlordTenant", title: "Landlord-tenant", copy: "Repairs, habitability, eviction, deposits, retaliation.", icon: Home },
  { value: "contract", title: "Contract dispute", copy: "Breach, services, invoices, payments, performance, damages.", icon: FileText },
  { value: "civilRights", title: "Civil rights / §1983", copy: "State actors, constitutional violations, Monell, immunity issues.", icon: ShieldCheck },
  { value: "smallClaims", title: "Small claims / local civil", copy: "Lower-dollar disputes, local hearings, simple evidence packets.", icon: Landmark },
  { value: "appeals", title: "Appeals", copy: "Notice deadline, record, preserved issues, standards of review.", icon: Scale },
  { value: "generalCivil", title: "General civil", copy: "Broad federal/state civil workflow before narrowing the matter.", icon: LibraryBig },
] satisfies Array<{ value: MatterType; title: string; copy: string; icon: typeof Gavel }>;

const courtOptions = [
  { value: "federal", title: "Federal court" },
  { value: "state", title: "State court" },
  { value: "smallClaims", title: "Small claims / local court" },
  { value: "administrative", title: "Administrative / agency process" },
  { value: "unknown", title: "Not sure yet" },
] satisfies Array<{ value: CourtSystem; title: string }>;

const urgencyOptions = [
  { value: "planning", title: "Planning / pre-litigation", copy: "No immediate court deadline known." },
  { value: "activeDeadline", title: "Active deadline", copy: "A response, hearing, filing, or letter deadline may be running." },
  { value: "servedOrSued", title: "Served or sued", copy: "I received papers, summons, complaint, motion, or notice." },
  { value: "postJudgment", title: "Post-judgment / appeal", copy: "Judgment/order entered; appeal or enforcement issues may exist." },
] satisfies Array<{ value: Urgency; title: string; copy: string }>;

function recommendedFirstModules(state: WizardState) {
  const modules = ["Playbooks", "Case Memory", "Timeline"];
  if (state.urgency === "servedOrSued" || state.caseType === "defendant") modules.push("Service & Default", "Docket & Deadlines", "Draft Review");
  if (state.urgency === "activeDeadline") modules.push("Docket & Deadlines", "Procedural Risk");
  if (["fcra", "fdcpa", "contract", "landlordTenant"].includes(state.matterType)) modules.push("Admin Process", "Document Packets");
  if (state.matterType === "appeals") modules.push("Docket & Deadlines", "Draft Review", "Case Law Bank");
  modules.push("Evidence", "Case Law Bank");
  return [...new Set(modules)].slice(0, 8);
}

function buildSummary(state: WizardState) {
  const selectedMatter = matterOptions.find((option) => option.value === state.matterType)?.title ?? state.matterType;
  const selectedCourt = courtOptions.find((option) => option.value === state.courtSystem)?.title ?? state.courtSystem;
  const selectedUrgency = urgencyOptions.find((option) => option.value === state.urgency)?.title ?? state.urgency;
  const userSummary = state.summary.trim() || "No factual summary entered yet.";

  return [
    userSummary,
    "",
    "--- Navigator intake profile ---",
    `Posture: ${state.caseType}`,
    `Matter type: ${selectedMatter}`,
    `Court system: ${selectedCourt}`,
    `Urgency: ${selectedUrgency}`,
    state.importantDate ? `Important date/deadline: ${state.importantDate}` : "Important date/deadline: not provided",
    `Recommended first modules: ${recommendedFirstModules(state).join(", ")}`,
  ].join("\n");
}

export default function NewCase() {
  const [, setLocation] = useLocation();
  const createCase = useCreateCase();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(defaultState);

  const progress = Math.round(((step + 1) / 4) * 100);
  const selectedMatter = matterOptions.find((option) => option.value === state.matterType) ?? matterOptions[matterOptions.length - 1];
  const MatterIcon = selectedMatter.icon;
  const firstModules = useMemo(() => recommendedFirstModules(state), [state]);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const canContinue = () => {
    if (step === 0) return !!state.caseType;
    if (step === 1) return !!state.matterType;
    if (step === 2) return !!state.courtSystem && !!state.urgency;
    return state.title.trim().length > 0;
  };

  const submit = () => {
    if (!state.title.trim()) {
      toast.error("Add a case title first");
      return;
    }

    createCase.mutate(
      {
        data: {
          title: state.title,
          caseType: state.caseType,
          opposingParty: state.opposingParty,
          court: state.court || courtOptions.find((option) => option.value === state.courtSystem)?.title,
          summary: buildSummary(state),
        } as any,
      },
      {
        onSuccess: (newCase) => {
          try {
            window.localStorage.setItem(`case:${newCase.id}:active-playbook`, JSON.stringify(state.matterType));
            window.localStorage.setItem(`case:${newCase.id}:memory-blocks`, JSON.stringify([
              { id: "intake-profile", type: "Fact", title: "Navigator intake profile", detail: buildSummary(state), status: "Captured" },
            ]));
          } catch {
            // non-critical local enhancement
          }
          toast.success("Case workspace initialized with Navigator profile");
          setLocation(`/cases/${newCase.id}`);
        },
        onError: () => toast.error("Failed to create case"),
      },
    );
  };

  return (
    <AppLayout title="Start a New Case">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Navigator intake</Badge>
            <CardTitle className="font-serif text-3xl md:text-4xl">Guided Case Initialization</CardTitle>
            <CardDescription className="max-w-3xl text-base">
              Start with posture, matter type, court system, urgency, and first recommended modules so the case opens inside the right litigation workflow instead of a blank generic file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2"><span>Step {step + 1} of 4</span><span className="font-mono font-bold">{progress}%</span></div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="font-serif">
                {step === 0 && "1. What posture is this case in?"}
                {step === 1 && "2. What type of matter is this?"}
                {step === 2 && "3. What system and urgency are you dealing with?"}
                {step === 3 && "4. Name the workspace and capture the first facts"}
              </CardTitle>
              <CardDescription>
                {step === 0 && "This determines whether the workspace starts from claims, defenses, or research."}
                {step === 1 && "This seeds the recommended playbook and procedural traps."}
                {step === 2 && "This tells the app whether deadlines, service, appeals, or admin process should be surfaced first."}
                {step === 3 && "This creates the case and saves an intake profile into the workspace summary and local case memory."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {postureOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = state.caseType === option.value;
                    return (
                      <button key={option.value} onClick={() => update("caseType", option.value)} className={`rounded-xl border p-5 text-left transition ${selected ? "border-primary/50 bg-primary/10" : "border-border/60 bg-background/40 hover:bg-accent/40"}`}>
                        <Icon className="h-6 w-6 text-primary mb-4" />
                        <div className="font-serif text-xl">{option.title}</div>
                        <p className="text-sm text-muted-foreground mt-2 leading-6">{option.copy}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {matterOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = state.matterType === option.value;
                    return (
                      <button key={option.value} onClick={() => update("matterType", option.value)} className={`rounded-xl border p-4 text-left transition ${selected ? "border-primary/50 bg-primary/10" : "border-border/60 bg-background/40 hover:bg-accent/40"}`}>
                        <Icon className="h-5 w-5 text-primary mb-3" />
                        <div className="font-bold text-sm">{option.title}</div>
                        <p className="text-xs text-muted-foreground mt-2 leading-5">{option.copy}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-bold">Court / forum</Label>
                    <div className="grid gap-2">
                      {courtOptions.map((option) => (
                        <button key={option.value} onClick={() => update("courtSystem", option.value)} className={`rounded-lg border px-4 py-3 text-left text-sm ${state.courtSystem === option.value ? "border-primary/50 bg-primary/10" : "border-border/60 bg-background/40"}`}>{option.title}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold">Urgency</Label>
                    <div className="grid gap-2">
                      {urgencyOptions.map((option) => (
                        <button key={option.value} onClick={() => update("urgency", option.value)} className={`rounded-lg border px-4 py-3 text-left ${state.urgency === option.value ? "border-primary/50 bg-primary/10" : "border-border/60 bg-background/40"}`}>
                          <div className="font-bold text-sm">{option.title}</div>
                          <p className="text-xs text-muted-foreground mt-1">{option.copy}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Known court / agency name</Label><Input value={state.court} onChange={(event) => update("court", event.target.value)} placeholder="U.S. District Court, county court, agency..." /></div>
                    <div className="grid gap-2"><Label>Important date / deadline</Label><Input type="date" value={state.importantDate} onChange={(event) => update("importantDate", event.target.value)} /></div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Case title</Label><Input value={state.title} onChange={(event) => update("title", event.target.value)} placeholder="Smith v. Acme / Credit bureau dispute / Eviction defense" /></div>
                    <div className="grid gap-2"><Label>Opposing party</Label><Input value={state.opposingParty} onChange={(event) => update("opposingParty", event.target.value)} placeholder="Company, collector, landlord, agency, person..." /></div>
                  </div>
                  <div className="grid gap-2"><Label>Brief summary</Label><Textarea className="min-h-32" value={state.summary} onChange={(event) => update("summary", event.target.value)} placeholder="What happened, what deadline exists, what relief you want, and what proof you have so far..." /></div>
                  <Alert className="border-[#D4A843]/30 bg-[#D4A843]/5">
                    <AlertTriangle className="h-4 w-4 text-[#D4A843]" />
                    <AlertTitle className="font-serif">Legal-information guardrail</AlertTitle>
                    <AlertDescription>This setup organizes a workspace. It does not determine claims, guarantee outcomes, or replace legal advice. Verify all court rules, deadlines, and authority.</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between gap-4 border-t border-border/50 bg-muted/10 p-6">
              <Button type="button" variant="outline" onClick={() => step === 0 ? setLocation("/dashboard") : setStep((current) => current - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> {step === 0 ? "Cancel" : "Back"}
              </Button>
              {step < 3 ? (
                <Button type="button" disabled={!canContinue()} onClick={() => setStep((current) => current + 1)}>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" disabled={createCase.isPending || !canContinue()} onClick={submit}>
                  {createCase.isPending ? "Creating..." : "Initialize Case Workspace"}
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2"><MatterIcon className="h-5 w-5 text-primary" /> Navigator Profile</CardTitle>
                <CardDescription>Live setup preview.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Posture</div><div className="capitalize font-medium">{state.caseType}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Matter</div><div className="font-medium">{selectedMatter.title}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Court system</div><div className="font-medium">{courtOptions.find((option) => option.value === state.courtSystem)?.title}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Urgency</div><div className="font-medium">{urgencyOptions.find((option) => option.value === state.urgency)?.title}</div></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> First modules</CardTitle>
                <CardDescription>Recommended starting path.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {firstModules.map((module) => <div key={module} className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm">{module}</div>)}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
