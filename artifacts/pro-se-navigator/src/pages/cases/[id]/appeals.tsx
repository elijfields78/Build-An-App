import { useMemo } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { usePersistentState } from "@/hooks/usePersistentState";
import { AlertTriangle, Archive, CalendarClock, CheckCircle2, FileStack, Gavel, Scale, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ReviewTarget = {
  id: string;
  title: string;
  orderDate: string;
  court: string;
  orderType: "Final judgment" | "Interlocutory order" | "Dismissal" | "Summary judgment" | "Default judgment" | "Discovery sanction" | "Other order";
  posture: "Need triage" | "Reconsideration window" | "Appeal window" | "Record building" | "Filed / monitoring";
  appealDays: string;
  reconsiderationDays: string;
  issuePreserved: "Unknown" | "Yes" | "No / risk" | "Partially";
  standardOfReview: string;
  recordItems: string;
  packetPlan: string;
  notes: string;
};

type ReviewTargetForm = Omit<ReviewTarget, "id">;

const defaultForm: ReviewTargetForm = {
  title: "",
  orderDate: "",
  court: "",
  orderType: "Other order",
  posture: "Need triage",
  appealDays: "30",
  reconsiderationDays: "28",
  issuePreserved: "Unknown",
  standardOfReview: "",
  recordItems: "",
  packetPlan: "",
  notes: "",
};

const seedTargets: ReviewTarget[] = [
  {
    id: "sample-dismissal",
    title: "Sample adverse order / judgment to triage",
    orderDate: "",
    court: "",
    orderType: "Dismissal",
    posture: "Need triage",
    appealDays: "30",
    reconsiderationDays: "28",
    issuePreserved: "Unknown",
    standardOfReview: "De novo for legal dismissal issues; verify jurisdiction-specific standard.",
    recordItems: "Order, judgment, motion, opposition, exhibits, hearing transcript if any, docket entries.",
    packetPlan: "Notice of appeal / motion for reconsideration checklist, record designation, issue list, deadline verification.",
    notes: "Educational planning only. Verify federal/state/local appellate deadlines and tolling rules before relying on any date.",
  },
];

const readinessChecks = [
  "Identify whether the order is final, appealable, interlocutory, or requires permission/review first",
  "Verify notice-of-appeal deadline from the actual rule, court, and judgment entry date",
  "Verify reconsideration/new-trial/alter-amend deadline and whether it tolls appeal time",
  "Confirm the issue was preserved in the trial court record or flag preservation risk",
  "Identify the standard of review for each issue",
  "Collect record items: order, judgment, motions, briefing, exhibits, transcript, docket entries",
  "Separate legal error, factual error, abuse-of-discretion, and procedural objections",
  "Plan packet: notice, filing fee/IFP, certificate of service, record designation, transcript request",
];

function addDays(dateValue: string, daysValue: string) {
  if (!dateValue || !daysValue) return "Needs date";
  const days = Number(daysValue);
  if (Number.isNaN(days)) return "Verify manually";
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function urgencyTone(target: ReviewTarget) {
  if (!target.orderDate) return "border-muted text-muted-foreground";
  const appealDate = new Date(`${target.orderDate}T00:00:00`);
  appealDate.setDate(appealDate.getDate() + Number(target.appealDays || 0));
  const daysLeft = Math.ceil((appealDate.getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) return "border-destructive/40 text-destructive bg-destructive/10";
  if (daysLeft <= 7) return "border-[#D4A843]/40 text-[#D4A843] bg-[#D4A843]/10";
  return "border-emerald-500/40 text-emerald-500 bg-emerald-500/10";
}

export default function AppealsReconsiderationTriage({ params }: { params: { id: string } }) {
  const [targets, setTargets] = usePersistentState<ReviewTarget[]>(`case:${params.id}:appeals-triage`, seedTargets);
  const [form, setForm] = usePersistentState<ReviewTargetForm>(`case:${params.id}:appeals-triage-form`, defaultForm);

  const urgentCount = useMemo(() => targets.filter((target) => urgencyTone(target).includes("destructive") || urgencyTone(target).includes("D4A843")).length, [targets]);
  const preservedCount = targets.filter((target) => target.issuePreserved === "Yes").length;
  const readiness = targets.length ? Math.round(((preservedCount + targets.filter((target) => target.standardOfReview.trim()).length + targets.filter((target) => target.recordItems.trim()).length) / (targets.length * 3)) * 100) : 0;

  const updateForm = (field: keyof ReviewTargetForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const addTarget = () => {
    if (!form.title.trim()) {
      toast.error("Add the order or judgment title first");
      return;
    }
    setTargets((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    setForm(defaultForm);
    toast.success("Appeal/reconsideration target added");
  };

  const removeTarget = (id: string) => setTargets((current) => current.filter((target) => target.id !== id));

  return (
    <CaseLayout caseId={params.id} title="Appeals & Reconsideration">
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Post-order triage</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><Gavel className="h-7 w-7 text-primary" /> Appeals & Reconsideration Triage</CardTitle>
            <CardDescription className="max-w-4xl">
              Track adverse orders, judgments, reconsideration windows, notice-of-appeal deadlines, issue preservation, standards of review, record items, and appellate packet planning. Educational workflow only — verify every deadline against the governing rules and docket.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="text-3xl font-mono font-bold text-primary">{targets.length}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">orders tracked</div></div>
            <div className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/5 p-4"><div className="text-3xl font-mono font-bold text-[#D4A843]">{urgentCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">deadline risks</div></div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="text-3xl font-mono font-bold text-emerald-500">{preservedCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">preserved issues</div></div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="flex justify-between text-xs mb-2"><span>Appeal readiness</span><span>{readiness}%</span></div><Progress value={readiness} className="h-2" /></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Add order / judgment</CardTitle>
              <CardDescription>Enter the ruling to evaluate without assuming the deadline is correct.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Title</Label><Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Order granting motion to dismiss" /></div>
              <div className="grid gap-2"><Label>Order / judgment date</Label><Input type="date" value={form.orderDate} onChange={(event) => updateForm("orderDate", event.target.value)} /></div>
              <div className="grid gap-2"><Label>Court / judge / docket note</Label><Input value={form.court} onChange={(event) => updateForm("court", event.target.value)} placeholder="U.S. District Court / state court / agency" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Order type</Label><select value={form.orderType} onChange={(event) => updateForm("orderType", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Final judgment", "Interlocutory order", "Dismissal", "Summary judgment", "Default judgment", "Discovery sanction", "Other order"] as ReviewTarget["orderType"][]).map((type) => <option key={type}>{type}</option>)}</select></div>
                <div className="grid gap-2"><Label>Posture</Label><select value={form.posture} onChange={(event) => updateForm("posture", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Need triage", "Reconsideration window", "Appeal window", "Record building", "Filed / monitoring"] as ReviewTarget["posture"][]).map((type) => <option key={type}>{type}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Appeal days</Label><Input value={form.appealDays} onChange={(event) => updateForm("appealDays", event.target.value)} placeholder="30" /></div>
                <div className="grid gap-2"><Label>Reconsideration days</Label><Input value={form.reconsiderationDays} onChange={(event) => updateForm("reconsiderationDays", event.target.value)} placeholder="28" /></div>
              </div>
              <div className="grid gap-2"><Label>Issue preserved?</Label><select value={form.issuePreserved} onChange={(event) => updateForm("issuePreserved", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Unknown", "Yes", "No / risk", "Partially"] as ReviewTarget["issuePreserved"][]).map((type) => <option key={type}>{type}</option>)}</select></div>
              <div className="grid gap-2"><Label>Standard of review</Label><Textarea value={form.standardOfReview} onChange={(event) => updateForm("standardOfReview", event.target.value)} placeholder="De novo, abuse of discretion, clear error, substantial evidence — verify." /></div>
              <div className="grid gap-2"><Label>Record items needed</Label><Textarea value={form.recordItems} onChange={(event) => updateForm("recordItems", event.target.value)} placeholder="Order, judgment, motion, opposition, transcript, exhibits..." /></div>
              <div className="grid gap-2"><Label>Packet plan</Label><Textarea value={form.packetPlan} onChange={(event) => updateForm("packetPlan", event.target.value)} placeholder="Notice of appeal, reconsideration motion, record designation, fee/IFP..." /></div>
              <div className="grid gap-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Deadline caveats, tolling questions, jurisdiction concerns..." /></div>
              <Button className="w-full" onClick={addTarget}>Save triage target</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            {targets.map((target) => (
              <Card key={target.id} className="overflow-hidden">
                <CardHeader className="border-b border-border/60 pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-serif text-xl">{target.title}</CardTitle>
                      <CardDescription>{target.court || "Court not set"} · {target.orderType}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2"><Badge variant="outline" className={urgencyTone(target)}>{target.orderDate ? `Appeal est. ${addDays(target.orderDate, target.appealDays)}` : "Need order date"}</Badge><Badge variant="outline">{target.posture}</Badge><Button variant="ghost" size="icon" onClick={() => removeTarget(target.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reconsideration est.</div><div className="font-mono mt-1">{addDays(target.orderDate, target.reconsiderationDays)}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Appeal est.</div><div className="font-mono mt-1">{addDays(target.orderDate, target.appealDays)}</div></div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Issue preserved</div><div className="font-mono mt-1">{target.issuePreserved}</div></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><div className="font-bold flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Standard</div><p className="mt-2 text-muted-foreground whitespace-pre-wrap">{target.standardOfReview || "Not researched yet."}</p></div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><div className="font-bold flex items-center gap-2"><Archive className="h-4 w-4 text-[#D4A843]" /> Record</div><p className="mt-2 text-muted-foreground whitespace-pre-wrap">{target.recordItems || "Record items not listed."}</p></div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3"><div className="font-bold flex items-center gap-2"><FileStack className="h-4 w-4 text-emerald-500" /> Packet</div><p className="mt-2 text-muted-foreground whitespace-pre-wrap">{target.packetPlan || "Packet plan not built."}</p></div>
                  </div>
                  {target.notes && <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground whitespace-pre-wrap">{target.notes}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader><CardTitle className="font-serif flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Deadline and appellate-risk guardrail</CardTitle><CardDescription>Appeal and reconsideration deadlines can be jurisdiction-specific and unforgiving. This page estimates planning dates only.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readinessChecks.map((check) => <div key={check} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3 text-sm"><CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" /> <span>{check}</span></div>)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground flex gap-3"><AlertTriangle className="h-5 w-5 text-[#D4A843] shrink-0" /> Do not rely on default day counts without checking the applicable rule, entry date, separate judgment requirement, tolling motion rules, weekends/holidays, local rules, and whether the order is appealable.</CardContent>
        </Card>
      </div>
    </CaseLayout>
  );
}
