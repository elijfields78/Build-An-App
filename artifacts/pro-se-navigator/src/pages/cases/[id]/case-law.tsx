import { useMemo } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpenCheck, CheckCircle2, ExternalLink, Link2, Quote, ShieldAlert, Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePersistentState } from "@/hooks/usePersistentState";

type VerificationStatus = "Verified" | "Partially verified" | "Research lead only" | "Unverified — do not file";
type AuthorityStrength = "Binding" | "Persuasive" | "Background" | "Unknown";
type TreatmentStatus = "Not checked" | "Good law / usable" | "Caution / distinguish" | "Negative treatment risk";
type AlignmentStatus = "Not checked" | "Matches proposition" | "Needs narrowing" | "Does not support proposition";

type Citation = {
  id: string;
  caseName: string;
  citation: string;
  courtYear: string;
  proposition: string;
  sourceUrl: string;
  status: VerificationStatus;
  strength: AuthorityStrength;
  treatmentStatus: TreatmentStatus;
  quoteAlignment: AlignmentStatus;
  propositionAlignment: AlignmentStatus;
  verificationNotes: string;
};

type CitationForm = Omit<Citation, "id">;

const statusMeta: Record<VerificationStatus, { className: string; description: string }> = {
  Verified: { className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500", description: "Case exists, citation/source are checked, and authority is ready for final draft review." },
  "Partially verified": { className: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]", description: "Source found, but proposition, treatment, quote, or jurisdiction still needs review." },
  "Research lead only": { className: "border-blue-400/40 bg-blue-400/10 text-blue-400", description: "Useful research lead, but not safe for filing drafts yet." },
  "Unverified — do not file": { className: "border-destructive/40 bg-destructive/10 text-destructive", description: "Blocked from final drafting until independently verified." },
};

const treatmentTone: Record<TreatmentStatus, string> = {
  "Not checked": "border-muted text-muted-foreground",
  "Good law / usable": "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
  "Caution / distinguish": "border-[#D4A843]/40 text-[#D4A843] bg-[#D4A843]/10",
  "Negative treatment risk": "border-destructive/40 text-destructive bg-destructive/10",
};

const alignmentTone: Record<AlignmentStatus, string> = {
  "Not checked": "border-muted text-muted-foreground",
  "Matches proposition": "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
  "Needs narrowing": "border-[#D4A843]/40 text-[#D4A843] bg-[#D4A843]/10",
  "Does not support proposition": "border-destructive/40 text-destructive bg-destructive/10",
};

const integrations = [
  "CourtListener / Free Law Project API",
  "RECAP docket and filing archive",
  "Perplexity cited research workflow",
  "Manual citation / Google Scholar link import",
  "Future Westlaw, Lexis, Fastcase, or Casetext-style provider adapter",
];

const qaChecks = [
  "Case exists at reliable source",
  "Citation format matches source",
  "Court/year/jurisdiction verified",
  "Quoted language appears in source",
  "Proposition is not broader than holding",
  "Authority strength reviewed for this court",
  "Negative treatment / caution status checked",
  "Draft placement marked verified or blocked",
];

const seedCitations: Citation[] = [
  {
    id: "twombly",
    caseName: "Bell Atlantic Corp. v. Twombly",
    citation: "550 U.S. 544 (2007)",
    courtYear: "U.S. Supreme Court / 2007",
    proposition: "Pleadings need enough factual matter to state a plausible claim, not just labels and conclusions.",
    sourceUrl: "https://www.oyez.org/cases/2006/05-1126",
    status: "Research lead only",
    strength: "Background",
    treatmentStatus: "Not checked",
    quoteAlignment: "Not checked",
    propositionAlignment: "Needs narrowing",
    verificationNotes: "Starter research lead only; verify official opinion/source and proposition before draft use.",
  },
  {
    id: "transunion",
    caseName: "TransUnion LLC v. Ramirez",
    citation: "594 U.S. 413 (2021)",
    courtYear: "U.S. Supreme Court / 2021",
    proposition: "Article III standing requires concrete harm; statutory violation alone may not be enough.",
    sourceUrl: "https://www.oyez.org/cases/2020/20-297",
    status: "Partially verified",
    strength: "Background",
    treatmentStatus: "Not checked",
    quoteAlignment: "Not checked",
    propositionAlignment: "Needs narrowing",
    verificationNotes: "Standing proposition is sensitive; verify exact holding and factual posture before using.",
  },
];

const defaultForm: CitationForm = {
  caseName: "",
  citation: "",
  courtYear: "",
  proposition: "",
  sourceUrl: "",
  status: "Research lead only",
  strength: "Unknown",
  treatmentStatus: "Not checked",
  quoteAlignment: "Not checked",
  propositionAlignment: "Not checked",
  verificationNotes: "",
};

function isQaSafe(citation: Citation) {
  return citation.status === "Verified"
    && citation.treatmentStatus === "Good law / usable"
    && citation.propositionAlignment === "Matches proposition"
    && citation.quoteAlignment !== "Does not support proposition";
}

export default function CaseLawBank({ params }: { params: { id: string } }) {
  const [citations, setCitations] = usePersistentState<Citation[]>(`case:${params.id}:case-law-bank`, seedCitations);
  const [form, setForm] = usePersistentState<CitationForm>(`case:${params.id}:case-law-form`, defaultForm);

  const blockedCount = useMemo(() => citations.filter((citation) => citation.status !== "Verified" || !isQaSafe(citation)).length, [citations]);
  const verifiedCount = useMemo(() => citations.filter((citation) => citation.status === "Verified").length, [citations]);
  const qaSafeCount = useMemo(() => citations.filter(isQaSafe).length, [citations]);

  const updateForm = (field: keyof CitationForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const saveAuthority = () => {
    if (!form.caseName.trim() || !form.citation.trim() || !form.sourceUrl.trim()) {
      toast.error("Add case name, citation, and source URL before saving");
      return;
    }

    setCitations((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    setForm(defaultForm);
    toast.success("Authority saved to Case Law Bank");
  };

  const removeAuthority = (id: string) => setCitations((current) => current.filter((citation) => citation.id !== id));

  return (
    <CaseLayout caseId={params.id} title="Case Law Bank">
      <div className="space-y-6">
        <Alert className={blockedCount > 0 ? "border-destructive/30 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5"}>
          <ShieldAlert className={blockedCount > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-emerald-500"} />
          <AlertTitle className="font-serif">Citation verification QA guardrail</AlertTitle>
          <AlertDescription>
            {blockedCount > 0
              ? `${blockedCount} authority item(s) are blocked from final draft placement until case existence, citation, treatment, quote/proposition alignment, and authority strength are verified.`
              : "All saved authority is marked QA-safe. Still verify every case, quote, citation, treatment status, and proposition before filing."}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit border-primary/20 bg-card/80">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" /> Add Authority</CardTitle>
              <CardDescription>Save case law with verification status, treatment review, proposition match, source link, and authority strength.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Case name</Label><Input value={form.caseName} onChange={(event) => updateForm("caseName", event.target.value)} placeholder="TransUnion LLC v. Ramirez" /></div>
              <div className="grid gap-2"><Label>Citation</Label><Input value={form.citation} onChange={(event) => updateForm("citation", event.target.value)} placeholder="594 U.S. 413 (2021)" /></div>
              <div className="grid gap-2"><Label>Court / year / jurisdiction</Label><Input value={form.courtYear} onChange={(event) => updateForm("courtYear", event.target.value)} placeholder="Supreme Court / 2021" /></div>
              <div className="grid gap-2"><Label>Source URL</Label><Input value={form.sourceUrl} onChange={(event) => updateForm("sourceUrl", event.target.value)} placeholder="CourtListener, Oyez, official court source..." /></div>
              <div className="grid gap-2"><Label>Proposition / issue supported</Label><Textarea className="min-h-24" value={form.proposition} onChange={(event) => updateForm("proposition", event.target.value)} placeholder="What statement does this case support?" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Verification status</Label><select value={form.status} onChange={(event) => updateForm("status", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{Object.keys(statusMeta).map((status) => <option key={status}>{status}</option>)}</select></div>
                <div className="grid gap-2"><Label>Authority strength</Label><select value={form.strength} onChange={(event) => updateForm("strength", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Binding", "Persuasive", "Background", "Unknown"] as AuthorityStrength[]).map((strength) => <option key={strength}>{strength}</option>)}</select></div>
              </div>
              <div className="grid gap-2"><Label>Treatment status</Label><select value={form.treatmentStatus} onChange={(event) => updateForm("treatmentStatus", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Not checked", "Good law / usable", "Caution / distinguish", "Negative treatment risk"] as TreatmentStatus[]).map((status) => <option key={status}>{status}</option>)}</select></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Quote alignment</Label><select value={form.quoteAlignment} onChange={(event) => updateForm("quoteAlignment", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Not checked", "Matches proposition", "Needs narrowing", "Does not support proposition"] as AlignmentStatus[]).map((status) => <option key={status}>{status}</option>)}</select></div>
                <div className="grid gap-2"><Label>Proposition alignment</Label><select value={form.propositionAlignment} onChange={(event) => updateForm("propositionAlignment", event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{(["Not checked", "Matches proposition", "Needs narrowing", "Does not support proposition"] as AlignmentStatus[]).map((status) => <option key={status}>{status}</option>)}</select></div>
              </div>
              <div className="grid gap-2"><Label>Verification notes</Label><Textarea className="min-h-20" value={form.verificationNotes} onChange={(event) => updateForm("verificationNotes", event.target.value)} placeholder="What was checked? What still needs verification? Any negative-treatment cautions?" /></div>
              <Button className="w-full" onClick={saveAuthority}>Save authority</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4"><div className="text-2xl font-mono font-bold text-primary">{citations.length}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">saved authorities</div></CardContent></Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20"><CardContent className="p-4"><div className="text-2xl font-mono font-bold text-emerald-500">{verifiedCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">verified</div></CardContent></Card>
              <Card className="bg-purple-400/5 border-purple-400/20"><CardContent className="p-4"><div className="text-2xl font-mono font-bold text-purple-400">{qaSafeCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">full QA safe</div></CardContent></Card>
              <Card className="bg-destructive/5 border-destructive/20"><CardContent className="p-4"><div className="text-2xl font-mono font-bold text-destructive">{blockedCount}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">blocked</div></CardContent></Card>
            </div>

            {citations.map((citation) => {
              const meta = statusMeta[citation.status];
              return (
                <Card key={citation.id} className="overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><CardTitle className="font-serif text-xl">{citation.caseName}</CardTitle><CardDescription className="font-mono mt-1">{citation.citation} · {citation.courtYear || "court/year not set"}</CardDescription></div>
                      <div className="flex flex-wrap gap-2"><Badge variant="outline" className={meta.className}>{citation.status}</Badge><Badge variant="outline">{citation.strength}</Badge>{isQaSafe(citation) ? <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">QA-safe</Badge> : <Badge variant="outline" className="border-destructive/40 text-destructive">Blocked</Badge>}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Proposition match</div><p className="text-sm leading-6">{citation.proposition || "No proposition entered yet."}</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="font-bold flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Treatment</div><Badge variant="outline" className={`mt-2 ${treatmentTone[citation.treatmentStatus ?? "Not checked"]}`}>{citation.treatmentStatus ?? "Not checked"}</Badge></div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="font-bold flex items-center gap-2"><Quote className="h-3.5 w-3.5 text-purple-400" /> Quote match</div><Badge variant="outline" className={`mt-2 ${alignmentTone[citation.quoteAlignment ?? "Not checked"]}`}>{citation.quoteAlignment ?? "Not checked"}</Badge></div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="font-bold flex items-center gap-2"><Scale className="h-3.5 w-3.5 text-[#D4A843]" /> Proposition</div><Badge variant="outline" className={`mt-2 ${alignmentTone[citation.propositionAlignment ?? "Not checked"]}`}>{citation.propositionAlignment ?? "Not checked"}</Badge></div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 p-3"><a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline break-all"><ExternalLink className="h-4 w-4 shrink-0" /> {citation.sourceUrl}</a><Button variant="ghost" size="icon" onClick={() => removeAuthority(citation.id)} aria-label={`Remove ${citation.caseName}`}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></div>
                    <div className="text-xs text-muted-foreground">{meta.description}</div>
                    {citation.verificationNotes && <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap">{citation.verificationNotes}</div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-serif flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Citation Verification QA Checklist</CardTitle><CardDescription>Use this before placing authority into a complaint, motion, opposition, declaration, demand, or settlement packet.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">{qaChecks.map((check) => <div key={check} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm"><CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" /> <span>{check}</span></div>)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif flex items-center gap-2"><Scale className="h-5 w-5 text-[#D4A843]" /> Research Integrations Roadmap</CardTitle><CardDescription>Google Scholar can be a manual research helper, but automated case-law infrastructure should start with CourtListener, RECAP, and Perplexity.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">{integrations.map((integration) => <div key={integration} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm"><Link2 className="h-4 w-4 text-primary" /> {integration}</div>)}</CardContent>
        </Card>

        <div className="flex justify-end"><Button disabled={blockedCount > 0}>{blockedCount > 0 ? `${blockedCount} citation(s) blocked — complete QA before draft placement` : "Authority ready for draft placement review"}</Button></div>
      </div>
    </CaseLayout>
  );
}
