import React, { useState, useEffect } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useAuth } from "@clerk/react";
import { toast } from "sonner";
import {
  Plus, Trash2, FileText, Wand2, Loader2, Copy, CheckCheck,
  ChevronDown, ChevronUp, Clock, AlertCircle, BookOpen, Gavel,
  Shield, Scale, FileX, ArrowDownLeft,
} from "lucide-react";
import {
  differenceInDays, differenceInHours, differenceInMinutes, isPast, format,
} from "date-fns";

type MotionType =
  | "Motion to Dismiss (12(b)(6))"
  | "Motion to Dismiss (12(b)(1))"
  | "Motion for Summary Judgment"
  | "Motion to Strike"
  | "Protective Order"
  | "Motion for Default Judgment"
  | "Motion to Compel"
  | "Motion in Limine"
  | "Motion for Reconsideration"
  | "Court Order"
  | "Other";

type MotionStatus = "New" | "Drafting" | "Filed" | "Resolved";

interface MotionItem {
  id: string;
  type: MotionType;
  title: string;
  movant: string;
  caseNumberReference: string;
  dateFiled: string;
  responseDeadline: string;
  status: MotionStatus;
  keyFacts: string;
}

const MOTION_TYPES: MotionType[] = [
  "Motion to Dismiss (12(b)(6))",
  "Motion to Dismiss (12(b)(1))",
  "Motion for Summary Judgment",
  "Motion to Strike",
  "Protective Order",
  "Motion for Default Judgment",
  "Motion to Compel",
  "Motion in Limine",
  "Motion for Reconsideration",
  "Court Order",
  "Other",
];

const STATUSES: MotionStatus[] = ["New", "Drafting", "Filed", "Resolved"];

const statusColor: Record<MotionStatus, string> = {
  New: "border-destructive/40 bg-destructive/10 text-destructive",
  Drafting: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  Filed: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  Resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
};

const standardDefenses = [
  {
    type: "Motion to Dismiss — Rule 12(b)(6)",
    icon: FileX,
    standard: "Failure to state a claim upon which relief can be granted.",
    opposition: [
      "Assert the complaint satisfies Twombly/Iqbal: plead enough factual matter to raise a plausible right to relief.",
      "Distinguish defendant's cited cases — show the facts here are materially different.",
      "Invoke the notice-pleading baseline: Rule 8(a) requires only a short, plain statement.",
      "If elements are in dispute, argue factual development is needed — 12(b)(6) tests the complaint, not the merits.",
      "Request leave to amend if dismissal is ordered (Rule 15(a)(2) — courts freely grant leave).",
    ],
    citation: "Bell Atl. Corp. v. Twombly, 550 U.S. 544 (2007); Ashcroft v. Iqbal, 556 U.S. 662 (2009)",
  },
  {
    type: "Motion to Dismiss — Rule 12(b)(1)",
    icon: Scale,
    standard: "Lack of subject-matter jurisdiction.",
    opposition: [
      "Identify your jurisdictional hook clearly: federal question (28 U.S.C. § 1331), diversity (§ 1332), or supplemental (§ 1367).",
      "For diversity: establish complete diversity between all plaintiffs and defendants and amount in controversy exceeding $75,000.",
      "For federal question: identify the specific federal statute or constitutional provision your claim arises under.",
      "If plaintiff, you bear the burden to allege facts supporting jurisdiction — address each element.",
      "Sovereign immunity: identify the precise statutory waiver (e.g., FTCA, APA) if suing a government entity.",
    ],
    citation: "Steel Co. v. Citizens for a Better Env't, 523 U.S. 83 (1998); Lujan v. Defenders of Wildlife, 504 U.S. 555 (1992)",
  },
  {
    type: "Motion for Summary Judgment (Rule 56)",
    icon: Gavel,
    standard: "No genuine dispute of material fact; movant entitled to judgment as a matter of law.",
    opposition: [
      "Submit a Rule 56(d) affidavit if discovery is incomplete — courts may defer or deny pending full discovery.",
      "Identify every genuine dispute of material fact: cite to deposition excerpts, affidavits, documents, or other record evidence.",
      "Show the movant has not met their initial burden — they must demonstrate the absence of a triable issue first.",
      "Inferences from disputed facts must be drawn in your favor as the non-movant.",
      "Attach your own affidavit (Rule 56(c)(4)) setting out specific facts showing a genuine dispute.",
      "If you lack access to key evidence held by defendant, request targeted discovery under Rule 56(d).",
    ],
    citation: "Celotex Corp. v. Catrett, 477 U.S. 317 (1986); Anderson v. Liberty Lobby, Inc., 477 U.S. 242 (1986)",
  },
  {
    type: "Motion to Strike (Rule 12(f))",
    icon: FileX,
    standard: "Strike redundant, immaterial, impertinent, or scandalous matter from a pleading.",
    opposition: [
      "Motions to strike are disfavored and rarely granted — courts resolve doubts in favor of the pleading.",
      "Show the challenged material is relevant to at least one of your claims or defenses.",
      "Argue that the motion is premature — material relevance often becomes clear through discovery.",
      "Courts typically deny motions to strike unless prejudice to the moving party is clear.",
      "If the motion targets affirmative defenses, oppose by showing each defense is properly pled.",
    ],
    citation: "Fed. R. Civ. P. 12(f); Stanbury Law Firm v. IRS, 221 F.3d 1059 (8th Cir. 2000)",
  },
  {
    type: "Protective Order (Rule 26(c))",
    icon: Shield,
    standard: "Movant must show good cause to protect against annoyance, embarrassment, oppression, or undue burden.",
    opposition: [
      "Show the requested discovery is relevant and proportional to the needs of the case (Rule 26(b)(1)).",
      "Challenge the good-cause showing — mere assertion of burden is insufficient.",
      "Propose a narrower scope if some protection is warranted — this demonstrates reasonableness.",
      "Argue the information sought is not confidential or already public.",
      "File a cross-motion to compel if defendant is withholding discovery without adequate justification.",
    ],
    citation: "Fed. R. Civ. P. 26(c); Seattle Times Co. v. Rhinehart, 467 U.S. 20 (1984)",
  },
  {
    type: "Motion for Default Judgment",
    icon: AlertCircle,
    standard: "Entry of default judgment after party fails to plead or otherwise defend.",
    opposition: [
      "If you are the defendant: file a motion to set aside default under Rule 55(c) — show good cause.",
      "Good cause factors: culpable conduct, prejudice to plaintiff, and meritorious defense.",
      "Show any default was not willful — technical defects in service or reasonable confusion are relevant.",
      "Present a proposed meritorious defense with specificity (need not guarantee victory, just plausibility).",
      "File and serve your answer immediately alongside the motion to set aside.",
    ],
    citation: "Fed. R. Civ. P. 55; Enron Oil Corp. v. Diakuhara, 10 F.3d 90 (2d Cir. 1993)",
  },
];

// ---------- Deadline Countdown ----------
function DeadlineCountdown({ motion }: { motion?: MotionItem }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!motion || !motion.responseDeadline) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">No open deadlines</p>
        <p className="text-xs font-mono text-muted-foreground">Log motions with response deadlines</p>
      </div>
    );
  }

  const due = new Date(motion.responseDeadline);
  const overdue = isPast(due);
  const days = Math.abs(differenceInDays(due, now));
  const hours = Math.abs(differenceInHours(due, now)) % 24;
  const mins = Math.abs(differenceInMinutes(due, now)) % 60;
  const urgent = days < 3;
  const color = overdue ? "text-destructive" : urgent ? "text-amber-400" : "text-primary";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">{motion.type}</p>
      <p className="text-sm font-semibold text-foreground line-clamp-2">{motion.title || "Untitled motion"}</p>
      <div className={`flex items-end gap-1 font-mono font-bold tracking-tighter ${color}`}>
        <span className="text-4xl leading-none">{String(days).padStart(2, "0")}</span>
        <span className="text-base pb-1">d</span>
        <span className="text-2xl leading-none">{String(hours).padStart(2, "0")}</span>
        <span className="text-sm pb-0.5">h</span>
        <span className="text-xl leading-none">{String(mins).padStart(2, "0")}</span>
        <span className="text-xs pb-0.5">m</span>
      </div>
      <div className={`text-[10px] font-mono uppercase tracking-widest ${overdue ? "text-destructive font-bold" : "text-muted-foreground"}`}>
        {overdue ? "OVERDUE" : "remaining"} · Due {format(due, "MMM dd, yyyy")}
      </div>
    </div>
  );
}

// ---------- Motion Item Card ----------
function MotionCard({
  motion,
  onUpdate,
  onDelete,
}: {
  motion: MotionItem;
  onUpdate: (m: MotionItem) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card/70 border-border/60">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <button
            className="flex items-center gap-2 text-left flex-1 min-w-0"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-1.5 shrink-0">
              <ArrowDownLeft className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{motion.type}</div>
              <p className="text-sm font-medium text-foreground truncate">
                {motion.title || <span className="italic text-muted-foreground">No title yet</span>}
              </p>
              {motion.movant && (
                <p className="text-[11px] text-muted-foreground">Filed by: {motion.movant}</p>
              )}
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {motion.responseDeadline && (
              <span className="text-[10px] font-mono text-muted-foreground hidden sm:block">
                Due {format(new Date(motion.responseDeadline), "MMM dd")}
              </span>
            )}
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${statusColor[motion.status]}`}>
              {motion.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="px-4 pb-4 space-y-3 pt-2 border-t border-border/50 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Motion / order type</Label>
              <select
                value={motion.type}
                onChange={(e) => onUpdate({ ...motion, type: e.target.value as MotionType })}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                {MOTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select
                value={motion.status}
                onChange={(e) => onUpdate({ ...motion, status: e.target.value as MotionStatus })}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Document title</Label>
              <Input
                value={motion.title}
                onChange={(e) => onUpdate({ ...motion, title: e.target.value })}
                placeholder="e.g., Defendant's Motion to Dismiss"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Movant (filer)</Label>
              <Input
                value={motion.movant}
                onChange={(e) => onUpdate({ ...motion, movant: e.target.value })}
                placeholder="e.g., Defendant Smith Corp."
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Case / docket number reference</Label>
              <Input
                value={motion.caseNumberReference}
                onChange={(e) => onUpdate({ ...motion, caseNumberReference: e.target.value })}
                placeholder="e.g., ECF No. 12, Doc. 7, or 1:24-cv-00123"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date filed / received</Label>
              <Input
                type="date"
                value={motion.dateFiled}
                onChange={(e) => onUpdate({ ...motion, dateFiled: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Response deadline</Label>
              <Input
                type="date"
                value={motion.responseDeadline}
                onChange={(e) => onUpdate({ ...motion, responseDeadline: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Key facts / your arguments (used in AI draft)</Label>
            <Textarea
              value={motion.keyFacts}
              onChange={(e) => onUpdate({ ...motion, keyFacts: e.target.value })}
              placeholder="Summarize the motion's key arguments and your factual basis for opposing it..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>
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

// ---------- Main Page ----------
export default function MotionResponseCockpit({ params }: { params: { id: string } }) {
  const { getToken } = useAuth();
  const [motions, setMotions] = usePersistentState<MotionItem[]>(
    `case:${params.id}:motions`,
    []
  );
  const [openDefense, setOpenDefense] = useState<number | null>(null);

  // AI drafter state
  const [selectedMotionId, setSelectedMotionId] = useState<string>("");
  const [customArgs, setCustomArgs] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState("");
  const [copied, setCopied] = useState(false);

  const openMotions = motions.filter((m) => m.status === "New" || m.status === "Drafting");
  const resolvedCount = motions.filter((m) => m.status === "Resolved" || m.status === "Filed").length;

  // Find nearest upcoming deadline from open motions
  const nearestDeadlineMotion = openMotions
    .filter((m) => m.responseDeadline)
    .sort((a, b) => new Date(a.responseDeadline).getTime() - new Date(b.responseDeadline).getTime())[0];

  const addMotion = () => {
    const newMotion: MotionItem = {
      id: crypto.randomUUID(),
      type: "Motion to Dismiss (12(b)(6))",
      title: "",
      movant: "",
      caseNumberReference: "",
      dateFiled: "",
      responseDeadline: "",
      status: "New",
      keyFacts: "",
    };
    setMotions((prev) => [...prev, newMotion]);
  };

  const updateMotion = (id: string, updated: MotionItem) => {
    setMotions((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const deleteMotion = (id: string) => {
    setMotions((prev) => prev.filter((m) => m.id !== id));
    if (selectedMotionId === id) setSelectedMotionId("");
  };

  const selectedMotion = motions.find((m) => m.id === selectedMotionId);

  const handleGenerate = async () => {
    if (!selectedMotion && !customArgs.trim()) {
      toast.error("Select a motion or describe your key arguments first.");
      return;
    }

    setIsGenerating(true);
    setDraftResult("");

    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${params.id}/motions/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          motionType: selectedMotion?.type ?? "motion",
          motionTitle: selectedMotion?.title ?? "",
          movant: selectedMotion?.movant ?? "",
          caseNumberReference: selectedMotion?.caseNumberReference ?? "",
          keyFacts: selectedMotion?.keyFacts ?? "",
          customArgs,
        }),
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
      toast.success("Opposition outline generated — review carefully before use.");
    } catch {
      toast.error("Failed to generate response outline.");
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
    <CaseLayout caseId={params.id} title="Motion & Order Response Cockpit">
      <div className="space-y-6">

        {/* Disclaimer */}
        <Alert className="border-destructive/25 bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertTitle className="font-serif">Missing a motion response deadline can end your case</AlertTitle>
          <AlertDescription>
            In federal court, you typically have 14–21 days to oppose a motion. If you miss the deadline, the court may grant the motion as unopposed. Always verify deadlines against local rules and the court's scheduling order. This tool provides legal-information support, not legal advice.
          </AlertDescription>
        </Alert>

        {/* Stats + Countdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`border-destructive/20 ${nearestDeadlineMotion ? "bg-destructive/5" : "bg-card/50"}`}>
            <CardContent className="p-5">
              <DeadlineCountdown motion={nearestDeadlineMotion} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold text-destructive">{openMotions.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">open motions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold">{motions.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">total logged</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold text-emerald-500">{resolvedCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">filed / resolved</div>
            </CardContent>
          </Card>
        </div>

        {/* Motion tracker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-destructive" />
              <h2 className="font-serif font-bold text-lg">Motion & Order Tracker</h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden sm:block">
                Log every motion and court order requiring a response
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={addMotion} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Motion / Order
            </Button>
          </div>

          {motions.length === 0 ? (
            <Card className="border-dashed border-border/50 bg-card/40">
              <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-destructive/10 p-4">
                  <FileText className="h-6 w-6 text-destructive/50" />
                </div>
                <div>
                  <p className="font-medium text-sm">No motions logged yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Log every motion filed against you and every court order you receive. Track response deadlines to avoid automatic dismissal.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addMotion}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Log first motion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {motions.map((m) => (
                <MotionCard
                  key={m.id}
                  motion={m}
                  onUpdate={(updated) => updateMotion(m.id, updated)}
                  onDelete={() => deleteMotion(m.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Response Drafter */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="font-serif font-bold text-lg">AI Opposition Drafter</h2>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden sm:block">
              Stream an AI-drafted opposition brief outline
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-base">Response builder</CardTitle>
                  <CardDescription className="text-xs">
                    Select a logged motion and add your key arguments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Select motion (optional)</Label>
                    <select
                      value={selectedMotionId}
                      onChange={(e) => setSelectedMotionId(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
                    >
                      <option value="">— Enter arguments manually —</option>
                      {motions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.type}{m.title ? ` — ${m.title}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMotion && selectedMotion.keyFacts && (
                    <div className="rounded-lg border border-border/50 bg-background/60 p-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">From motion tracker</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{selectedMotion.keyFacts}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Your key arguments / additional facts
                    </Label>
                    <Textarea
                      value={customArgs}
                      onChange={(e) => setCustomArgs(e.target.value)}
                      placeholder="e.g., The motion mischaracterizes the timeline. My complaint alleges specific facts on dates X, Y, Z showing plausible claims. The defendant ignores Circuit precedent on element 2..."
                      rows={5}
                      className="text-sm resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!selectedMotionId && !customArgs.trim())}
                    className="w-full font-bold"
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Drafting outline...</>
                    ) : (
                      <><Wand2 className="h-4 w-4 mr-2" />Draft Opposition Outline</>
                    )}
                  </Button>

                  <Card className="bg-amber-400/5 border-amber-400/20">
                    <CardContent className="p-3 text-xs text-muted-foreground space-y-1 leading-relaxed">
                      <p className="font-bold text-foreground">Review before use</p>
                      <p>AI opposition outlines require your review. Verify all legal standards, verify citations independently, and consult local rules before filing any response.</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="bg-card/50 border-border/60 h-full flex flex-col">
                <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/50">
                  <div>
                    <CardTitle className="font-serif text-base">Opposition outline</CardTitle>
                    <CardDescription className="text-xs">
                      {draftResult ? "Review and adapt before filing" : "Outline will stream here"}
                    </CardDescription>
                  </div>
                  {draftResult && (
                    <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 text-xs shrink-0">
                      {copied
                        ? <><CheckCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />Copied</>
                        : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy</>}
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
                        Select a motion and add your key arguments, then click "Draft Opposition Outline" to generate a structured response framework.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Standard Defenses Reference */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-serif font-bold text-lg">Standard Defenses Reference</h2>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden sm:block">
              Legal education only — not legal advice
            </span>
          </div>

          <div className="space-y-2">
            {standardDefenses.map((defense, i) => {
              const Icon = defense.icon;
              const isOpen = openDefense === i;
              return (
                <Card key={defense.type} className="bg-card/50 border-border/60">
                  <button
                    className="w-full text-left"
                    onClick={() => setOpenDefense(isOpen ? null : i)}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg border border-border/60 bg-background/70 p-2 shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <CardTitle className="font-serif text-sm">{defense.type}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{defense.standard}</CardDescription>
                          </div>
                        </div>
                        {isOpen
                          ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                  </button>

                  {isOpen && (
                    <CardContent className="px-4 pb-4 pt-0 space-y-4 border-t border-border/50">
                      <div className="space-y-2 pt-3">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Opposition arguments</p>
                        <ul className="space-y-2">
                          {defense.opposition.map((arg, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-sm text-foreground/85">
                              <span className="text-primary font-mono text-xs mt-0.5 shrink-0">{j + 1}.</span>
                              {arg}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Key citations</p>
                        <p className="text-xs font-mono text-primary">{defense.citation}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        This is legal education only, not legal advice. Verify all citations independently before use in any filing.
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </CaseLayout>
  );
}
