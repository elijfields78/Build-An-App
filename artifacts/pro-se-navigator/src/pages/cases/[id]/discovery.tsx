import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePersistentState } from "@/hooks/usePersistentState";
import { AlertTriangle, ClipboardCheck, FileQuestion, FileSearch, ListChecks, Plus, ShieldAlert, TimerReset, Trash2 } from "lucide-react";

type DiscoveryType = "Interrogatories" | "Requests for Production" | "Requests for Admission" | "Depositions/Notices" | "Subpoenas" | "Initial Disclosures";
type DiscoveryStatus = "Received" | "Drafting" | "Served" | "Responded" | "Overdue" | "Extension";

type DiscoveryRequest = {
  id: string;
  requestType: DiscoveryType;
  servedDate: string;
  responseDays: string;
  servingParty: string;
  respondingParty: string;
  status: DiscoveryStatus;
  ruleSource: string;
  extensionAgreement: string;
  evidenceLinked: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);
const defaultDraft: Omit<DiscoveryRequest, "id"> = {
  requestType: "Requests for Production",
  servedDate: today,
  responseDays: "30",
  servingParty: "Opposing Party",
  respondingParty: "Me / my side",
  status: "Received",
  ruleSource: "Verify applicable rule, court order, and local rules",
  extensionAgreement: "",
  evidenceLinked: "",
  notes: "",
};

const discoveryChecks = [
  "Calendar response deadline from rule/order and service method",
  "Identify each request that needs an objection, answer, document, or privilege review",
  "Separate admissions, interrogatories, document requests, deposition notices, and subpoenas",
  "For RFAs, answer or object on time to avoid deemed admissions risk",
  "Log extension agreements in writing",
  "Link produced documents/evidence to each request",
  "Prepare privilege/confidentiality review if needed",
  "Preserve proof of service for your responses",
  "Track deficiencies in opposing party responses",
  "Use discovery gaps to update settlement leverage and summary judgment readiness",
];

function dueDate(servedDate: string, responseDays: string) {
  if (!servedDate) return null;
  const days = Number(responseDays);
  if (!Number.isFinite(days)) return null;
  const due = new Date(`${servedDate}T12:00:00`);
  due.setDate(due.getDate() + days);
  return due;
}

function deadlineStatus(request: DiscoveryRequest) {
  if (request.status === "Responded") return { label: "Responded", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" };
  if (request.status === "Extension") return { label: "Extension", className: "border-blue-400/40 bg-blue-400/10 text-blue-400" };
  const due = dueDate(request.servedDate, request.responseDays);
  if (!due) return { label: "Needs date", className: "border-muted text-muted-foreground" };
  const daysRemaining = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (daysRemaining < 0) return { label: `${Math.abs(daysRemaining)}d overdue`, className: "border-destructive/40 bg-destructive/10 text-destructive" };
  if (daysRemaining <= 7) return { label: `${daysRemaining}d left`, className: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]" };
  return { label: `${daysRemaining}d left`, className: "border-primary/30 bg-primary/10 text-primary" };
}

function formatDate(date: Date | null) {
  if (!date) return "Needs date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DiscoveryCommandCenter({ params }: { params: { id: string } }) {
  const [requests, setRequests] = usePersistentState<DiscoveryRequest[]>(`case:${params.id}:discovery-requests`, []);
  const [draft, setDraft] = usePersistentState<Omit<DiscoveryRequest, "id">>(`case:${params.id}:discovery-draft`, defaultDraft);
  const [checks, setChecks] = usePersistentState<Record<string, boolean>>(`case:${params.id}:discovery-checks`, {});

  const rfaCount = requests.filter((request) => request.requestType === "Requests for Admission" && request.status !== "Responded").length;
  const overdueCount = requests.filter((request) => deadlineStatus(request).label.includes("overdue")).length;
  const completeChecks = discoveryChecks.filter((check) => checks[check]).length;
  const readiness = Math.round((completeChecks / discoveryChecks.length) * 100);

  const addRequest = () => {
    setRequests((current) => [{ id: crypto.randomUUID(), ...draft }, ...current]);
    setDraft(defaultDraft);
  };

  return (
    <CaseLayout caseId={params.id} title="Discovery Command Center">
      <div className="space-y-6">
        <Alert className="border-destructive/25 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="font-serif">Requests for Admission danger zone</AlertTitle>
          <AlertDescription>
            RFAs can create serious risk if not timely answered or objected to. This tool tracks the danger, but users must verify applicable rules, court orders, service method, extensions, and local practice.
          </AlertDescription>
        </Alert>

        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Discovery phase workstation</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><FileSearch className="h-7 w-7 text-primary" /> Discovery Command Center</CardTitle>
            <CardDescription className="max-w-3xl">
              Track interrogatories, requests for production, RFAs, deposition notices, subpoenas, and disclosures. The goal is deadline discipline, clean responses, evidence mapping, and settlement/summary-judgment readiness.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="text-3xl font-mono font-bold text-primary">{requests.length}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">requests tracked</div></div>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4"><div className="text-3xl font-mono font-bold text-destructive">{rfaCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">open RFA risks</div></div>
            <div className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/5 p-4"><div className="text-3xl font-mono font-bold text-[#D4A843]">{overdueCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">overdue items</div></div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="flex justify-between text-sm mb-2"><span>Readiness</span><span className="font-mono font-bold">{readiness}%</span></div><Progress value={readiness} className="h-2" /></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader><CardTitle className="font-serif flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Add discovery item</CardTitle><CardDescription>Track a request set, notice, subpoena, or disclosure obligation.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Request type</Label><select value={draft.requestType} onChange={(event) => setDraft((current) => ({ ...current, requestType: event.target.value as DiscoveryType }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Interrogatories", "Requests for Production", "Requests for Admission", "Depositions/Notices", "Subpoenas", "Initial Disclosures"] as DiscoveryType[]).map((type) => <option key={type}>{type}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Served date</Label><Input type="date" value={draft.servedDate} onChange={(event) => setDraft((current) => ({ ...current, servedDate: event.target.value }))} /></div><div className="grid gap-2"><Label>Response days</Label><Input type="number" value={draft.responseDays} onChange={(event) => setDraft((current) => ({ ...current, responseDays: event.target.value }))} /></div></div>
              <div className="grid gap-2"><Label>Serving party</Label><Input value={draft.servingParty} onChange={(event) => setDraft((current) => ({ ...current, servingParty: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Responding party</Label><Input value={draft.respondingParty} onChange={(event) => setDraft((current) => ({ ...current, respondingParty: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Status</Label><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as DiscoveryStatus }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Received", "Drafting", "Served", "Responded", "Overdue", "Extension"] as DiscoveryStatus[]).map((status) => <option key={status}>{status}</option>)}</select></div>
              <div className="grid gap-2"><Label>Rule / order / source</Label><Input value={draft.ruleSource} onChange={(event) => setDraft((current) => ({ ...current, ruleSource: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Extension agreement</Label><Input value={draft.extensionAgreement} onChange={(event) => setDraft((current) => ({ ...current, extensionAgreement: event.target.value }))} placeholder="Written extension? date? by whom?" /></div>
              <div className="grid gap-2"><Label>Evidence linked</Label><Input value={draft.evidenceLinked} onChange={(event) => setDraft((current) => ({ ...current, evidenceLinked: event.target.value }))} placeholder="Documents/exhibits tied to this request" /></div>
              <div className="grid gap-2"><Label>Notes</Label><Textarea className="min-h-24" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></div>
              <Button onClick={addRequest} className="w-full">Add discovery item</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            {requests.length === 0 && <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No discovery items yet. Add requests, notices, subpoenas, disclosures, or response obligations.</CardContent></Card>}
            {requests.map((request) => {
              const due = dueDate(request.servedDate, request.responseDays);
              const status = deadlineStatus(request);
              const isRfa = request.requestType === "Requests for Admission";
              return (
                <Card key={request.id} className={isRfa ? "border-destructive/30 bg-destructive/5" : "bg-card/70 border-border/60"}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2"><Badge variant="outline">{request.requestType}</Badge><Badge variant="outline" className={status.className}>{status.label}</Badge>{isRfa && <Badge variant="outline" className="border-destructive/40 text-destructive">RFA danger</Badge>}</div>
                        <CardTitle className="font-serif text-xl">{request.servingParty} → {request.respondingParty}</CardTitle>
                        <CardDescription>{request.ruleSource}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setRequests((current) => current.filter((saved) => saved.id !== request.id))}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Served</div><div className="font-mono mt-1">{request.servedDate}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Due</div><div className="font-mono mt-1">{formatDate(due)}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div><div className="font-mono mt-1">{request.status}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Evidence</div><div className="font-mono mt-1 truncate">{request.evidenceLinked || "Not linked"}</div></div>
                    {(request.extensionAgreement || request.notes) && <div className="md:col-span-4 rounded-lg border border-border/60 bg-background/50 p-3 text-muted-foreground whitespace-pre-wrap">{request.extensionAgreement && `Extension: ${request.extensionAgreement}\n`}{request.notes}</div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-serif flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Discovery readiness checklist</CardTitle><CardDescription>Prevents deadline misses, harmful admissions, weak responses, and evidence gaps.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {discoveryChecks.map((check) => (
              <label key={check} className="flex items-start gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!checks[check]} onChange={() => setChecks((current) => ({ ...current, [check]: !current[check] }))} className="mt-1" />
                <span className={checks[check] ? "line-through text-muted-foreground" : "text-foreground"}>{check}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-destructive/20 bg-destructive/5"><CardContent className="p-4 text-sm"><ShieldAlert className="h-5 w-5 text-destructive mb-2" /> RFAs need special attention because unanswered admissions can become case-damaging.</CardContent></Card>
          <Card className="border-[#D4A843]/20 bg-[#D4A843]/5"><CardContent className="p-4 text-sm"><TimerReset className="h-5 w-5 text-[#D4A843] mb-2" /> Verify deadline source, service method, extensions, and local rules before relying on any date.</CardContent></Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="p-4 text-sm"><ClipboardCheck className="h-5 w-5 text-emerald-500 mb-2" /> Link discovery responses to evidence, settlement leverage, and summary judgment readiness.</CardContent></Card>
        </div>
      </div>
    </CaseLayout>
  );
}
