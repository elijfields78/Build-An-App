import { useMemo, useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock, Clock3, FileWarning, Gavel, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

type DocketRow = {
  id: string;
  doc: string;
  type: string;
  filedBy: string;
  filedDate: string;
  responseDays: string;
  workflow: string;
};

type DocketForm = Omit<DocketRow, "id" | "workflow">;

const todayIso = new Date().toISOString().slice(0, 10);

const initialRows: DocketRow[] = [
  { id: "demo-motion", doc: "Doc 12", type: "Motion to Dismiss", filedBy: "Opposing Party", filedDate: todayIso, responseDays: "14", workflow: "Rule 12 Response" },
  { id: "demo-order", doc: "Doc 13", type: "Order", filedBy: "Court", filedDate: todayIso, responseDays: "7", workflow: "Court Order Review" },
  { id: "demo-service", doc: "Doc 14", type: "Proof of Service", filedBy: "User", filedDate: todayIso, responseDays: "21", workflow: "Default Readiness" },
];

const defaultForm: DocketForm = {
  doc: "",
  type: "Motion / filing",
  filedBy: "Opposing Party",
  filedDate: todayIso,
  responseDays: "14",
};

const readinessItems = [
  { id: "service", label: "Verify service method, date, party served, and proof of service." },
  { id: "answer", label: "Verify opposing-party answer or response deadline from the rule/order." },
  { id: "motion", label: "Verify motion response deadline and local-rule page/format limits." },
  { id: "jury", label: "Check whether a jury demand deadline or waiver issue exists." },
  { id: "default", label: "If no response appears, verify default/default judgment prerequisites." },
  { id: "appeal", label: "For orders/judgments, verify reconsideration or appeal clocks immediately." },
];

function computeDeadline(filedDate: string, responseDays: string) {
  if (!filedDate) return null;
  const days = Number(responseDays);
  if (!Number.isFinite(days)) return null;
  const due = new Date(`${filedDate}T12:00:00`);
  due.setDate(due.getDate() + days);
  return due;
}

function formatDate(date: Date | null) {
  if (!date) return "Needs date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function workflowForType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("dismiss")) return "Rule 12 Response";
  if (normalized.includes("service")) return "Default Readiness";
  if (normalized.includes("discovery")) return "Discovery Response";
  if (normalized.includes("order")) return "Court Order Review";
  if (normalized.includes("judgment")) return "Appeal/Reconsideration Review";
  return "Docket Review";
}

function statusForDeadline(deadline: Date | null) {
  if (!deadline) return { label: "Needs verification", className: "border-muted text-muted-foreground" };
  const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (daysRemaining < 0) return { label: `${Math.abs(daysRemaining)}d overdue`, className: "border-destructive/40 bg-destructive/10 text-destructive" };
  if (daysRemaining <= 3) return { label: `${daysRemaining}d left`, className: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]" };
  return { label: `${daysRemaining}d left`, className: "border-primary/30 bg-primary/10 text-primary" };
}

export default function CaseDocketDeadlines({ params }: { params: { id: string } }) {
  const [docketRows, setDocketRows] = useState<DocketRow[]>(initialRows);
  const [form, setForm] = useState<DocketForm>(defaultForm);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const reviewedCount = useMemo(() => readinessItems.filter((item) => checks[item.id]).length, [checks]);
  const computedRows = useMemo(
    () => docketRows.map((row) => ({ row, deadline: computeDeadline(row.filedDate, row.responseDays) })),
    [docketRows],
  );

  const updateForm = (field: keyof DocketForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addRow = () => {
    if (!form.doc.trim() || !form.filedDate.trim()) {
      toast.error("Add a document label and filed date first");
      return;
    }

    const nextRow: DocketRow = {
      id: crypto.randomUUID(),
      ...form,
      workflow: workflowForType(form.type),
    };

    setDocketRows((current) => [nextRow, ...current]);
    setForm(defaultForm);
    toast.success("Docket entry added for deadline review");
  };

  const removeRow = (id: string) => {
    setDocketRows((current) => current.filter((row) => row.id !== id));
  };

  return (
    <CaseLayout caseId={params.id} title="Docket & Deadline Intelligence">
      <div className="space-y-6">
        <Alert className="border-[#D4A843]/30 bg-[#D4A843]/5">
          <CalendarClock className="h-4 w-4 text-[#D4A843]" />
          <AlertTitle className="font-serif">Procedural timing command center</AlertTitle>
          <AlertDescription>
            Track docket events, response windows, default-readiness signals, and court-order tasks. Deadline calculations are
            estimates for review only. Verify every date against court orders, rules, local rules, and the live docket.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" /> Docket Activity Table
              </CardTitle>
              <CardDescription>
                Add filings, orders, service events, discovery requests, and motion activity to estimate response windows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2 grid gap-2">
                    <Label htmlFor="doc">Document / docket label</Label>
                    <Input id="doc" value={form.doc} onChange={(event) => updateForm("doc", event.target.value)} placeholder="Doc 18 — Motion..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Input id="type" value={form.type} onChange={(event) => updateForm("type", event.target.value)} placeholder="Motion, Order..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="filedBy">Filed by</Label>
                    <Input id="filedBy" value={form.filedBy} onChange={(event) => updateForm("filedBy", event.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="filedDate">Filed date</Label>
                    <Input id="filedDate" type="date" value={form.filedDate} onChange={(event) => updateForm("filedDate", event.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="responseDays">Response days</Label>
                    <Input id="responseDays" type="number" value={form.responseDays} onChange={(event) => updateForm("responseDays", event.target.value)} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={addRow}>
                    <Plus className="mr-2 h-4 w-4" /> Add docket entry
                  </Button>
                </div>
              </div>

              {computedRows.map(({ row, deadline }) => {
                const status = statusForDeadline(deadline);
                return (
                  <div key={row.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-lg border border-border/60 bg-card/60 p-4 text-sm">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Document</div>
                      <div className="font-mono font-bold">{row.doc}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Type</div>
                      <div>{row.type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Filed by</div>
                      <div>{row.filedBy}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Estimated deadline</div>
                      <div>{formatDate(deadline)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
                      <Badge variant="outline" className={status.className}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Workflow</div>
                        <Badge variant="outline">{row.workflow}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} aria-label={`Remove ${row.doc}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" /> Procedural Readiness
              </CardTitle>
              <CardDescription>{reviewedCount} / {readinessItems.length} timing issues reviewed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {readinessItems.map((item) => (
                <label key={item.id} className="flex items-start gap-3 rounded-md bg-background/60 border border-border/60 px-3 py-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checks[item.id]}
                    onChange={() => setChecks((current) => ({ ...current, [item.id]: !current[item.id] }))}
                    className="mt-1"
                  />
                  <span className={checks[item.id] ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" /> PACER / RECAP Import Plan
            </CardTitle>
            <CardDescription>
              First version: manual docket entries and uploaded docket PDFs. Next: NEF/email parser and RECAP lookup. Direct PACER login comes later with fee warnings and explicit user consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            {[
              "Manual docket upload",
              "NEF/email parser",
              "RECAP public lookup",
              "Direct PACER later",
            ].map((step, index) => (
              <div key={step} className="rounded-lg border border-border/60 bg-background/50 p-4 font-medium">
                <div className="flex items-center gap-2">
                  <Clock3 className={index === 0 ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />
                  {step}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {index === 0 ? "Active now through manual event intake." : "Queued for integration sprint."}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </CaseLayout>
  );
}
