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
import { AlertTriangle, FileCheck2, Gavel, ListChecks, Plus, Scale, ShieldAlert, TimerReset, Trash2 } from "lucide-react";

type MotionType = "Motion to Dismiss" | "Summary Judgment" | "Discovery Motion" | "Motion to Compel" | "Motion for Default" | "Court Order" | "Other Motion";
type MotionStatus = "Received" | "Needs Response" | "Drafting" | "Filed" | "Hearing Set" | "Ruled" | "Monitoring";
type ResponsePosture = "Opposition" | "Reply" | "Compliance" | "Reconsideration" | "Appeal Issue" | "No response planned yet";

type MotionItem = {
  id: string;
  motionType: MotionType;
  title: string;
  filedBy: string;
  filedDate: string;
  responseDays: string;
  hearingDate: string;
  status: MotionStatus;
  responsePosture: ResponsePosture;
  ruleSource: string;
  coreArguments: string;
  evidenceNeeded: string;
  responsePacket: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);
const defaultDraft: Omit<MotionItem, "id"> = {
  motionType: "Motion to Dismiss",
  title: "",
  filedBy: "Opposing party",
  filedDate: today,
  responseDays: "14",
  hearingDate: "",
  status: "Needs Response",
  responsePosture: "Opposition",
  ruleSource: "Verify rule, court order, local rule, and judge standing order",
  coreArguments: "",
  evidenceNeeded: "",
  responsePacket: "Notice/opposition, memorandum, declaration/affidavit, exhibits, proposed order if required",
  notes: "",
};

const readinessChecks = [
  "Confirm response deadline from the rule, local rule, court order, and service method",
  "Identify whether the motion attacks jurisdiction, pleading sufficiency, evidence, discovery, default, or procedure",
  "List each argument the moving party made before drafting a response",
  "Map each response point to facts, evidence, authority, or procedural objection",
  "Separate legal argument from factual declarations and exhibits",
  "Check page limits, formatting, certificate of service, proposed order, and hearing rules",
  "Verify every citation before using it in a draft",
  "Calendar hearing date, reply deadline, and any order-compliance deadline",
  "Save filed response and proof of service back into the case record",
  "Update settlement leverage and procedural risk after the motion/order is resolved",
];

function dueDate(filedDate: string, responseDays: string) {
  if (!filedDate) return null;
  const days = Number(responseDays);
  if (!Number.isFinite(days)) return null;
  const due = new Date(`${filedDate}T12:00:00`);
  due.setDate(due.getDate() + days);
  return due;
}

function statusBadge(item: MotionItem) {
  if (item.status === "Filed" || item.status === "Ruled") return { label: item.status, className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" };
  if (item.status === "Hearing Set") return { label: "Hearing set", className: "border-blue-400/40 bg-blue-400/10 text-blue-400" };
  const due = dueDate(item.filedDate, item.responseDays);
  if (!due) return { label: item.status, className: "border-muted text-muted-foreground" };
  const daysRemaining = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (daysRemaining < 0) return { label: `${Math.abs(daysRemaining)}d overdue`, className: "border-destructive/40 bg-destructive/10 text-destructive" };
  if (daysRemaining <= 7) return { label: `${daysRemaining}d left`, className: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]" };
  return { label: `${daysRemaining}d left`, className: "border-primary/30 bg-primary/10 text-primary" };
}

function formatDate(date: Date | null) {
  if (!date) return "Needs date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const motionTypes: MotionType[] = ["Motion to Dismiss", "Summary Judgment", "Discovery Motion", "Motion to Compel", "Motion for Default", "Court Order", "Other Motion"];
const statuses: MotionStatus[] = ["Received", "Needs Response", "Drafting", "Filed", "Hearing Set", "Ruled", "Monitoring"];
const postures: ResponsePosture[] = ["Opposition", "Reply", "Compliance", "Reconsideration", "Appeal Issue", "No response planned yet"];

export default function MotionOrderCockpit({ params }: { params: { id: string } }) {
  const [items, setItems] = usePersistentState<MotionItem[]>(`case:${params.id}:motions-orders`, []);
  const [draft, setDraft] = usePersistentState<Omit<MotionItem, "id">>(`case:${params.id}:motions-draft`, defaultDraft);
  const [checks, setChecks] = usePersistentState<Record<string, boolean>>(`case:${params.id}:motions-checks`, {});

  const urgentCount = items.filter((item) => statusBadge(item).label.includes("overdue") || statusBadge(item).label.includes("d left")).length;
  const unresolvedCount = items.filter((item) => !["Filed", "Ruled"].includes(item.status)).length;
  const completeChecks = readinessChecks.filter((check) => checks[check]).length;
  const readiness = Math.round((completeChecks / readinessChecks.length) * 100);

  const addItem = () => {
    setItems((current) => [{ id: crypto.randomUUID(), ...draft, title: draft.title || draft.motionType }, ...current]);
    setDraft(defaultDraft);
  };

  return (
    <CaseLayout caseId={params.id} title="Motion & Order Response Cockpit">
      <div className="space-y-6">
        <Alert className="border-[#D4A843]/25 bg-[#D4A843]/5">
          <AlertTriangle className="h-4 w-4 text-[#D4A843]" />
          <AlertTitle className="font-serif">Response deadline guardrail</AlertTitle>
          <AlertDescription>
            This cockpit organizes motion/order response work. It does not determine strategy or deadlines. Verify the docket, service method, court order, local rules, judge standing orders, and applicable civil rules before relying on any response date.
          </AlertDescription>
        </Alert>

        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Motion response workstation</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><Gavel className="h-7 w-7 text-primary" /> Motion & Order Response Cockpit</CardTitle>
            <CardDescription className="max-w-3xl">
              Track motions, court orders, response deadlines, argument matrices, evidence needs, hearing dates, and response packets so users do not treat high-risk filings like generic tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="text-3xl font-mono font-bold text-primary">{items.length}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">motions/orders</div></div>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4"><div className="text-3xl font-mono font-bold text-destructive">{urgentCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">deadline signals</div></div>
            <div className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/5 p-4"><div className="text-3xl font-mono font-bold text-[#D4A843]">{unresolvedCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">unresolved items</div></div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="flex justify-between text-sm mb-2"><span>Packet readiness</span><span className="font-mono font-bold">{readiness}%</span></div><Progress value={readiness} className="h-2" /></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader><CardTitle className="font-serif flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Add motion/order</CardTitle><CardDescription>Capture the filing or order and build a response plan.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Type</Label><select value={draft.motionType} onChange={(event) => setDraft((current) => ({ ...current, motionType: event.target.value as MotionType }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{motionTypes.map((type) => <option key={type}>{type}</option>)}</select></div>
              <div className="grid gap-2"><Label>Title</Label><Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Defendant's Motion to Dismiss" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Filed/order date</Label><Input type="date" value={draft.filedDate} onChange={(event) => setDraft((current) => ({ ...current, filedDate: event.target.value }))} /></div><div className="grid gap-2"><Label>Response days</Label><Input type="number" value={draft.responseDays} onChange={(event) => setDraft((current) => ({ ...current, responseDays: event.target.value }))} /></div></div>
              <div className="grid gap-2"><Label>Filed by / issued by</Label><Input value={draft.filedBy} onChange={(event) => setDraft((current) => ({ ...current, filedBy: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Hearing date</Label><Input type="date" value={draft.hearingDate} onChange={(event) => setDraft((current) => ({ ...current, hearingDate: event.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Status</Label><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as MotionStatus }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{statuses.map((status) => <option key={status}>{status}</option>)}</select></div><div className="grid gap-2"><Label>Posture</Label><select value={draft.responsePosture} onChange={(event) => setDraft((current) => ({ ...current, responsePosture: event.target.value as ResponsePosture }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{postures.map((posture) => <option key={posture}>{posture}</option>)}</select></div></div>
              <div className="grid gap-2"><Label>Rule/order source</Label><Input value={draft.ruleSource} onChange={(event) => setDraft((current) => ({ ...current, ruleSource: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Argument matrix</Label><Textarea className="min-h-24" value={draft.coreArguments} onChange={(event) => setDraft((current) => ({ ...current, coreArguments: event.target.value }))} placeholder="Argument 1 → response theory → facts/evidence/authority needed..." /></div>
              <div className="grid gap-2"><Label>Evidence needed</Label><Textarea className="min-h-20" value={draft.evidenceNeeded} onChange={(event) => setDraft((current) => ({ ...current, evidenceNeeded: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Response packet</Label><Textarea className="min-h-20" value={draft.responsePacket} onChange={(event) => setDraft((current) => ({ ...current, responsePacket: event.target.value }))} /></div>
              <div className="grid gap-2"><Label>Notes</Label><Textarea className="min-h-20" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></div>
              <Button onClick={addItem} className="w-full">Add motion/order</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            {items.length === 0 && <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No motions or orders tracked yet. Add a motion, order, hearing notice, or response obligation.</CardContent></Card>}
            {items.map((item) => {
              const due = dueDate(item.filedDate, item.responseDays);
              const badge = statusBadge(item);
              return (
                <Card key={item.id} className="bg-card/70 border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2"><Badge variant="outline">{item.motionType}</Badge><Badge variant="outline" className={badge.className}>{badge.label}</Badge><Badge variant="outline">{item.responsePosture}</Badge></div>
                        <CardTitle className="font-serif text-xl">{item.title}</CardTitle>
                        <CardDescription>{item.filedBy} • {item.ruleSource}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((saved) => saved.id !== item.id))}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Filed/order</div><div className="font-mono mt-1">{item.filedDate}</div></div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Response due</div><div className="font-mono mt-1">{formatDate(due)}</div></div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Hearing</div><div className="font-mono mt-1">{item.hearingDate || "Not set"}</div></div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div><div className="font-mono mt-1">{item.status}</div></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="font-bold flex gap-2 items-center"><Scale className="h-4 w-4 text-primary" /> Argument matrix</div><p className="mt-2 text-muted-foreground whitespace-pre-wrap">{item.coreArguments || "Not mapped yet."}</p></div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="font-bold flex gap-2 items-center"><ShieldAlert className="h-4 w-4 text-[#D4A843]" /> Evidence needed</div><p className="mt-2 text-muted-foreground whitespace-pre-wrap">{item.evidenceNeeded || "Not mapped yet."}</p></div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="font-bold flex gap-2 items-center"><FileCheck2 className="h-4 w-4 text-emerald-500" /> Response packet</div><p className="mt-2 text-muted-foreground whitespace-pre-wrap">{item.responsePacket}</p></div>
                    </div>
                    {item.notes && <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-serif flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Motion response readiness checklist</CardTitle><CardDescription>Transforms motion/order pressure into a structured response packet plan.</CardDescription></CardHeader>
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
          <Card className="border-destructive/20 bg-destructive/5"><CardContent className="p-4 text-sm"><TimerReset className="h-5 w-5 text-destructive mb-2" /> Late motion responses can create severe risk. Always verify the real response deadline from docket/rules/orders.</CardContent></Card>
          <Card className="border-[#D4A843]/20 bg-[#D4A843]/5"><CardContent className="p-4 text-sm"><Gavel className="h-5 w-5 text-[#D4A843] mb-2" /> Court orders may require compliance, reconsideration research, appeal issue spotting, or no response at all.</CardContent></Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="p-4 text-sm"><FileCheck2 className="h-5 w-5 text-emerald-500 mb-2" /> Link every response packet to verified citations, evidence, declarations, exhibits, and service proof.</CardContent></Card>
        </div>
      </div>
    </CaseLayout>
  );
}
