import React, { useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useAuth } from "@clerk/react";
import { toast } from "sonner";
import {
  Search, Plus, Trash2, FileText, Inbox, Wand2,
  Loader2, Copy, CheckCheck, ClipboardList, AlertCircle,
  CalendarClock, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp,
} from "lucide-react";

type DiscoveryType = "Interrogatory" | "RFP" | "RFA" | "Deposition";
type DiscoveryStatus = "Draft" | "Served" | "Responded" | "Disputed";
type Direction = "outgoing" | "incoming";

interface DiscoveryItem {
  id: string;
  direction: Direction;
  type: DiscoveryType;
  description: string;
  party: string;
  serviceDate: string;
  responseDeadline: string;
  status: DiscoveryStatus;
  objectionPlan: string;
}

const TYPES: DiscoveryType[] = ["Interrogatory", "RFP", "RFA", "Deposition"];
const STATUSES: DiscoveryStatus[] = ["Draft", "Served", "Responded", "Disputed"];

const typeLabel: Record<DiscoveryType, string> = {
  Interrogatory: "Interrogatory",
  RFP: "Request for Production",
  RFA: "Request for Admission",
  Deposition: "Deposition Notice",
};

const statusColor: Record<DiscoveryStatus, string> = {
  Draft: "border-muted-foreground/30 bg-muted/20 text-muted-foreground",
  Served: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  Responded: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  Disputed: "border-destructive/40 bg-destructive/10 text-destructive",
};

function emptyItem(direction: Direction): DiscoveryItem {
  return {
    id: crypto.randomUUID(),
    direction,
    type: "Interrogatory",
    description: "",
    party: "",
    serviceDate: "",
    responseDeadline: "",
    status: "Draft",
    objectionPlan: "",
  };
}

function ItemCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: DiscoveryItem;
  onUpdate: (updated: DiscoveryItem) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isIncoming = item.direction === "incoming";

  return (
    <Card className="bg-card/70 border-border/60">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <button
            className="flex items-center gap-2 text-left flex-1 min-w-0"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className={`rounded-md border p-1.5 shrink-0 ${isIncoming ? "border-amber-400/30 bg-amber-400/10" : "border-primary/30 bg-primary/10"}`}>
              {isIncoming
                ? <ArrowDownLeft className="h-3.5 w-3.5 text-amber-400" />
                : <ArrowUpRight className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {typeLabel[item.type]}
                </span>
                {item.party && (
                  <span className="text-[10px] text-muted-foreground">· {item.party}</span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">
                {item.description || <span className="italic text-muted-foreground">No description yet</span>}
              </p>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${statusColor[item.status]}`}>
              {item.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="px-4 pb-4 space-y-3 pt-2 border-t border-border/50 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <select
                value={item.type}
                onChange={(e) => onUpdate({ ...item, type: e.target.value as DiscoveryType })}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                {TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select
                value={item.status}
                onChange={(e) => onUpdate({ ...item, status: e.target.value as DiscoveryStatus })}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {isIncoming ? "Served by (opposing party)" : "Recipient"}
              </Label>
              <Input
                value={item.party}
                onChange={(e) => onUpdate({ ...item, party: e.target.value })}
                placeholder={isIncoming ? "Opposing counsel / defendant" : "Defendant / opposing party"}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Service date</Label>
                <Input
                  type="date"
                  value={item.serviceDate}
                  onChange={(e) => onUpdate({ ...item, serviceDate: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Response deadline</Label>
                <Input
                  type="date"
                  value={item.responseDeadline}
                  onChange={(e) => onUpdate({ ...item, responseDeadline: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description / subject matter</Label>
            <Textarea
              value={item.description}
              onChange={(e) => onUpdate({ ...item, description: e.target.value })}
              placeholder="What information does this request seek?"
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {isIncoming && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Your objection plan / response notes</Label>
              <Textarea
                value={item.objectionPlan}
                onChange={(e) => onUpdate({ ...item, objectionPlan: e.target.value })}
                placeholder="Planned objections, relevant privilege claims, or response strategy..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Remove
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function DiscoveryCommandCenter({ params }: { params: { id: string } }) {
  const { getToken } = useAuth();
  const [items, setItems] = usePersistentState<DiscoveryItem[]>(
    `case:${params.id}:discovery-items`,
    []
  );

  // AI draft state
  const [draftType, setDraftType] = useState<DiscoveryType>("Interrogatory");
  const [draftDescription, setDraftDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState("");
  const [copied, setCopied] = useState(false);

  const outgoing = items.filter((i) => i.direction === "outgoing");
  const incoming = items.filter((i) => i.direction === "incoming");

  const respondedCount = items.filter((i) => i.status === "Responded").length;
  const disputedCount = items.filter((i) => i.status === "Disputed").length;
  const health = items.length === 0 ? 0 : Math.round((respondedCount / items.length) * 100);

  const addItem = (direction: Direction) => {
    setItems((prev) => [...prev, emptyItem(direction)]);
  };

  const updateItem = (id: string, updated: DiscoveryItem) => {
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleGenerate = async () => {
    if (!draftDescription.trim()) {
      toast.error("Describe what information you need first.");
      return;
    }

    setIsGenerating(true);
    setDraftResult("");

    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${params.id}/discovery/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: draftType, description: draftDescription }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setDraftResult((prev) => prev + decoder.decode(value));
        }
      }
      toast.success("Draft generated — review carefully before use.");
    } catch {
      toast.error("Failed to generate draft.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draftResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CaseLayout caseId={params.id} title="Discovery Command Center">
      <div className="space-y-6">

        {/* Disclaimer */}
        <Alert className="border-amber-400/25 bg-amber-400/5">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertTitle className="font-serif">Discovery is time-sensitive and rule-bound</AlertTitle>
          <AlertDescription>
            Federal civil discovery deadlines under Rule 26–37 are strict. Track every deadline, verify local rules and the court's scheduling order, and consult a legal aid organization when possible. This tool provides legal-information support, not legal advice.
          </AlertDescription>
        </Alert>

        {/* Health score stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold text-primary">{health}%</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">discovery health</div>
              <Progress value={health} className="h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold">{outgoing.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">outgoing requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold">{incoming.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">incoming requests</div>
            </CardContent>
          </Card>
          <Card className={disputedCount > 0 ? "bg-destructive/5 border-destructive/20" : ""}>
            <CardContent className="p-5">
              <div className={`text-4xl font-mono font-bold ${disputedCount > 0 ? "text-destructive" : ""}`}>{disputedCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">disputed / contested</div>
            </CardContent>
          </Card>
        </div>

        {/* Outgoing requests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              <h2 className="font-serif font-bold text-lg">Your Discovery Requests</h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Interrogatories · RFPs · RFAs · Depositions you send to opposing party
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => addItem("outgoing")} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Request
            </Button>
          </div>

          {outgoing.length === 0 ? (
            <Card className="border-dashed border-border/50 bg-card/40">
              <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-primary/10 p-4">
                  <Search className="h-6 w-6 text-primary/60" />
                </div>
                <div>
                  <p className="font-medium text-sm">No outgoing requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Track interrogatories, RFPs, RFAs, and deposition notices you serve on the opposing party.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => addItem("outgoing")}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add first request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {outgoing.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={(updated) => updateItem(item.id, updated)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Incoming requests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-amber-400" />
              <h2 className="font-serif font-bold text-lg">Opposing Party's Requests</h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Discovery served on you — track deadlines and objections
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => addItem("incoming")} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Received Request
            </Button>
          </div>

          {incoming.length === 0 ? (
            <Card className="border-dashed border-border/50 bg-card/40">
              <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-amber-400/10 p-4">
                  <Inbox className="h-6 w-6 text-amber-400/60" />
                </div>
                <div>
                  <p className="font-medium text-sm">No incoming requests logged</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Log every discovery request you receive. Missing a response deadline can result in waived objections or sanctions.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => addItem("incoming")}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Log received request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {incoming.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={(updated) => updateItem(item.id, updated)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Draft Generator */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="font-serif font-bold text-lg">AI Discovery Drafter</h2>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Generate a properly formatted discovery request
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-base">Request builder</CardTitle>
                  <CardDescription className="text-xs">
                    Describe what you need to discover — the AI will format it properly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Request type</Label>
                    <select
                      value={draftType}
                      onChange={(e) => setDraftType(e.target.value as DiscoveryType)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
                    >
                      {TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">What information do you need?</Label>
                    <Textarea
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      placeholder={
                        draftType === "Interrogatory"
                          ? "e.g., All communications between defendant and their supervisor about my termination between Jan–Mar 2024"
                          : draftType === "RFP"
                          ? "e.g., All documents, emails, and records related to the incident on March 5, 2024"
                          : draftType === "RFA"
                          ? "e.g., That defendant received my written dispute letter on or before January 15, 2024"
                          : "e.g., Corporate designee on policies governing employee discipline and termination"
                      }
                      rows={5}
                      className="text-sm resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !draftDescription.trim()}
                    className="w-full font-bold"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Drafting...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Draft
                      </>
                    )}
                  </Button>

                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="p-3 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                      <p className="font-bold text-foreground">Review before use</p>
                      <p>AI drafts require your review. Verify the request is proportional (Rule 26(b)(1)), doesn't seek privileged material, and complies with local rules and the scheduling order.</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="bg-card/50 border-border/60 h-full flex flex-col">
                <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/50">
                  <div>
                    <CardTitle className="font-serif text-base">Generated draft</CardTitle>
                    <CardDescription className="text-xs">
                      {draftResult ? "Review and adapt before serving" : "Draft will appear here"}
                    </CardDescription>
                  </div>
                  {draftResult && (
                    <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 text-xs shrink-0">
                      {copied ? (
                        <><CheckCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</>
                      )}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  {draftResult || isGenerating ? (
                    <div className="h-full overflow-auto p-5">
                      <pre className="font-mono text-sm leading-7 text-foreground/90 whitespace-pre-wrap">
                        {draftResult}
                        {isGenerating && <span className="animate-pulse text-primary">▌</span>}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6 gap-3">
                      <div className="rounded-full bg-primary/10 p-4">
                        <FileText className="h-6 w-6 text-primary/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fill in the builder on the left and click "Generate Draft" to create a formatted discovery request.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Quick reference */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Discovery timing quick reference
            </CardTitle>
            <CardDescription className="text-xs">Federal rules — verify against your local rules and scheduling order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Initial disclosures", rule: "Rule 26(a)(1)", timing: "14 days after Rule 26(f) conference" },
                { label: "Interrogatories", rule: "Rule 33", timing: "30 days to respond after service" },
                { label: "RFP / RFA", rule: "Rule 34 / 36", timing: "30 days to respond after service" },
                { label: "Deposition notice", rule: "Rule 30", timing: "Reasonable notice — typically 10+ days" },
              ].map((ref) => (
                <div key={ref.label} className="rounded-lg border border-border/50 bg-background/60 p-3">
                  <div className="text-xs font-bold text-foreground mb-1">{ref.label}</div>
                  <div className="text-[10px] font-mono text-primary mb-1">{ref.rule}</div>
                  <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <CalendarClock className="h-3 w-3 shrink-0 mt-0.5" />
                    {ref.timing}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </CaseLayout>
  );
}
