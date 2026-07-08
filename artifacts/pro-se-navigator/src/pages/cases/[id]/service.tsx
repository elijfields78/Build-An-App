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
import { AlertTriangle, CalendarClock, CheckCircle2, FileCheck2, Gavel, Plus, ShieldCheck, TimerReset, Trash2, UserCheck } from "lucide-react";

type ServiceTarget = {
  id: string;
  defendantName: string;
  defendantType: "Individual" | "Corporation/LLC" | "Government" | "Unknown";
  serviceMethod: string;
  serviceDate: string;
  proofFiledDate: string;
  answerDays: string;
  appeared: "Unknown" | "No" | "Yes" | "Extension requested";
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);
const defaultDraft: Omit<ServiceTarget, "id"> = {
  defendantName: "",
  defendantType: "Unknown",
  serviceMethod: "Personal service / certified mail / registered agent / waiver",
  serviceDate: today,
  proofFiledDate: "",
  answerDays: "21",
  appeared: "Unknown",
  notes: "",
};

const readinessChecks = [
  "Summons issued by clerk before service",
  "Correct legal name for each defendant verified",
  "Correct service method verified for defendant type",
  "Correct person/entity served",
  "Service date documented",
  "Proof/return/affidavit of service filed",
  "Response deadline calculated from applicable rule/order",
  "Docket checked for answer, motion, appearance, or extension",
  "Servicemembers / minors / government / special-default rules considered where applicable",
  "Default entry vs default judgment sequence researched",
];

function addDays(date: string, days: string) {
  if (!date) return null;
  const parsedDays = Number(days);
  if (!Number.isFinite(parsedDays)) return null;
  const due = new Date(`${date}T12:00:00`);
  due.setDate(due.getDate() + parsedDays);
  return due;
}

function formatDate(date: Date | null) {
  if (!date) return "Needs service date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusFor(target: ServiceTarget) {
  if (!target.serviceDate) return { label: "Not served", className: "border-muted text-muted-foreground", defaultReady: false };
  if (target.appeared === "Yes") return { label: "Appearance/response logged", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500", defaultReady: false };
  if (target.appeared === "Extension requested") return { label: "Extension issue", className: "border-blue-400/40 bg-blue-400/10 text-blue-400", defaultReady: false };
  const deadline = addDays(target.serviceDate, target.answerDays);
  if (!deadline) return { label: "Needs calculation", className: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]", defaultReady: false };
  const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (daysRemaining < 0) return { label: `${Math.abs(daysRemaining)}d past response window`, className: "border-destructive/40 bg-destructive/10 text-destructive", defaultReady: true };
  if (daysRemaining <= 3) return { label: `${daysRemaining}d left`, className: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]", defaultReady: false };
  return { label: `${daysRemaining}d left`, className: "border-primary/30 bg-primary/10 text-primary", defaultReady: false };
}

export default function ServiceDefaultCenter({ params }: { params: { id: string } }) {
  const [targets, setTargets] = usePersistentState<ServiceTarget[]>(`case:${params.id}:service-targets`, []);
  const [draft, setDraft] = usePersistentState<Omit<ServiceTarget, "id">>(`case:${params.id}:service-draft`, defaultDraft);
  const [checks, setChecks] = usePersistentState<Record<string, boolean>>(`case:${params.id}:service-checks`, {});

  const completeChecks = readinessChecks.filter((check) => checks[check]).length;
  const readiness = Math.round((completeChecks / readinessChecks.length) * 100);
  const defaultCandidates = targets.filter((target) => statusFor(target).defaultReady).length;

  const addTarget = () => {
    if (!draft.defendantName.trim()) return;
    setTargets((current) => [{ id: crypto.randomUUID(), ...draft }, ...current]);
    setDraft(defaultDraft);
  };

  return (
    <CaseLayout caseId={params.id} title="Service & Default Readiness">
      <div className="space-y-6">
        <Alert className="border-destructive/25 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="font-serif">Default-readiness is procedural, not automatic</AlertTitle>
          <AlertDescription>
            This workflow helps track service, response windows, appearances, proof of service, and default questions to research. It should not tell users to file default automatically. Users must verify rules, docket status, party status, local rules, and court requirements.
          </AlertDescription>
        </Alert>

        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Procedural clock</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><UserCheck className="h-7 w-7 text-primary" /> Service of Process Command Center</CardTitle>
            <CardDescription className="max-w-3xl">
              Track each defendant, service method, proof of service, response clock, appearance status, and default-readiness questions. This is one of the most important procedural pressure systems in the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-3xl font-mono font-bold text-primary">{targets.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">service targets</div>
            </div>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="text-3xl font-mono font-bold text-destructive">{defaultCandidates}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">default issues to verify</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="flex justify-between text-sm mb-2"><span>Checklist</span><span className="font-mono font-bold">{readiness}%</span></div>
              <Progress value={readiness} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Add service target</CardTitle>
              <CardDescription>Track one defendant/entity per card.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Defendant / entity</Label><Input value={draft.defendantName} onChange={(event) => setDraft((current) => ({ ...current, defendantName: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Defendant type</Label><select value={draft.defendantType} onChange={(event) => setDraft((current) => ({ ...current, defendantType: event.target.value as ServiceTarget["defendantType"] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>Individual</option><option>Corporation/LLC</option><option>Government</option><option>Unknown</option></select></div>
              <div className="grid gap-2"><Label>Service method</Label><Input value={draft.serviceMethod} onChange={(event) => setDraft((current) => ({ ...current, serviceMethod: event.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Service date</Label><Input type="date" value={draft.serviceDate} onChange={(event) => setDraft((current) => ({ ...current, serviceDate: event.target.value }))} /></div><div className="grid gap-2"><Label>Answer days</Label><Input type="number" value={draft.answerDays} onChange={(event) => setDraft((current) => ({ ...current, answerDays: event.target.value }))} /></div></div>
              <div className="grid gap-2"><Label>Proof filed date</Label><Input type="date" value={draft.proofFiledDate} onChange={(event) => setDraft((current) => ({ ...current, proofFiledDate: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Appearance / response status</Label><select value={draft.appeared} onChange={(event) => setDraft((current) => ({ ...current, appeared: event.target.value as ServiceTarget["appeared"] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>Unknown</option><option>No</option><option>Yes</option><option>Extension requested</option></select></div>
              <div className="grid gap-2"><Label>Notes</Label><Textarea className="min-h-24" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></div>
              <Button onClick={addTarget} className="w-full">Add target</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            {targets.length === 0 && (
              <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No service targets yet. Add each defendant to start tracking response/default windows.</CardContent></Card>
            )}
            {targets.map((target) => {
              const deadline = addDays(target.serviceDate, target.answerDays);
              const status = statusFor(target);
              return (
                <Card key={target.id} className="bg-card/70 border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2"><Badge variant="outline">{target.defendantType}</Badge><Badge variant="outline" className={status.className}>{status.label}</Badge></div>
                        <CardTitle className="font-serif text-xl">{target.defendantName}</CardTitle>
                        <CardDescription>{target.serviceMethod}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setTargets((current) => current.filter((saved) => saved.id !== target.id))}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Served</div><div className="font-mono mt-1">{target.serviceDate || "Not set"}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Response due</div><div className="font-mono mt-1">{formatDate(deadline)}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Proof filed</div><div className="font-mono mt-1">{target.proofFiledDate || "Needs proof"}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Appearance</div><div className="font-mono mt-1">{target.appeared}</div></div>
                    {target.notes && <div className="md:col-span-4 rounded-lg border border-border/60 bg-background/50 p-3 text-muted-foreground">{target.notes}</div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-primary" /> Default Readiness Checklist</CardTitle>
            <CardDescription>Use this before researching clerk's entry of default, default judgment, or any response to missed deadlines.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {readinessChecks.map((check) => (
              <label key={check} className="flex items-start gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!checks[check]} onChange={() => setChecks((current) => ({ ...current, [check]: !current[check] }))} className="mt-1" />
                <span className={checks[check] ? "line-through text-muted-foreground" : "text-foreground"}>{check}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 text-sm"><CalendarClock className="h-5 w-5 text-primary mb-2" /> Track every service-triggered response window.</CardContent></Card>
          <Card className="border-[#D4A843]/20 bg-[#D4A843]/5"><CardContent className="p-4 text-sm"><TimerReset className="h-5 w-5 text-[#D4A843] mb-2" /> Verify extensions, appearances, and local rules before default analysis.</CardContent></Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="p-4 text-sm"><CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" /> A clean service record strengthens procedural posture and settlement leverage.</CardContent></Card>
        </div>
      </div>
    </CaseLayout>
  );
}
