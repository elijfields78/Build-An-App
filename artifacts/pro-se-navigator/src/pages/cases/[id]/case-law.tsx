import { useMemo, useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpenCheck, ExternalLink, Link2, ShieldAlert, Sparkles, Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";

type VerificationStatus = "Verified" | "Partially verified" | "Research lead only" | "Unverified — do not file";
type AuthorityStrength = "Binding" | "Persuasive" | "Background" | "Unknown";

type Citation = {
  id: string;
  caseName: string;
  citation: string;
  courtYear: string;
  proposition: string;
  sourceUrl: string;
  status: VerificationStatus;
  strength: AuthorityStrength;
};

type CitationForm = Omit<Citation, "id">;

const statusMeta: Record<VerificationStatus, { className: string; description: string }> = {
  Verified: {
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
    description: "Case exists and source link/citation are confirmed.",
  },
  "Partially verified": {
    className: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]",
    description: "Source found, but proposition, treatment, or jurisdiction still needs review.",
  },
  "Research lead only": {
    className: "border-blue-400/40 bg-blue-400/10 text-blue-400",
    description: "Useful lead, but not safe for filing drafts yet.",
  },
  "Unverified — do not file": {
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    description: "Blocked from final drafting until independently verified.",
  },
};

const integrations = [
  "CourtListener / Free Law Project API",
  "RECAP docket and filing archive",
  "Perplexity cited research workflow",
  "Manual citation / Google Scholar link import",
  "Future Westlaw, Lexis, Fastcase, or Casetext-style provider adapter",
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
};

export default function CaseLawBank({ params }: { params: { id: string } }) {
  const [citations, setCitations] = useState<Citation[]>(seedCitations);
  const [form, setForm] = useState<CitationForm>(defaultForm);

  const unverifiedCount = useMemo(
    () => citations.filter((citation) => citation.status !== "Verified").length,
    [citations],
  );
  const draftSafeCount = citations.length - unverifiedCount;

  const updateForm = (field: keyof CitationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveAuthority = () => {
    if (!form.caseName.trim() || !form.citation.trim() || !form.sourceUrl.trim()) {
      toast.error("Add case name, citation, and source URL before saving");
      return;
    }

    setCitations((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    setForm(defaultForm);
    toast.success("Authority saved to Case Law Bank");
  };

  const removeAuthority = (id: string) => {
    setCitations((current) => current.filter((citation) => citation.id !== id));
  };

  return (
    <CaseLayout caseId={params.id} title="Case Law Bank">
      <div className="space-y-6">
        <Alert className={unverifiedCount > 0 ? "border-destructive/30 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5"}>
          <ShieldAlert className={unverifiedCount > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-emerald-500"} />
          <AlertTitle className="font-serif">Citation hallucination guardrail</AlertTitle>
          <AlertDescription>
            {unverifiedCount > 0
              ? `${unverifiedCount} authority item(s) are blocked from final draft placement until verified. Only verified sources should enter filing drafts.`
              : "All saved authority is marked verified. Still verify every case, quote, citation, and legal proposition before filing."}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit border-primary/20 bg-card/80">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-primary" /> Add Authority
              </CardTitle>
              <CardDescription>
                Save case law with verification status, proposition match, source link, and authority strength.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="caseName">Case name</Label>
                <Input id="caseName" value={form.caseName} onChange={(event) => updateForm("caseName", event.target.value)} placeholder="TransUnion LLC v. Ramirez" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="citation">Citation</Label>
                <Input id="citation" value={form.citation} onChange={(event) => updateForm("citation", event.target.value)} placeholder="594 U.S. 413 (2021)" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="courtYear">Court / year / jurisdiction</Label>
                <Input id="courtYear" value={form.courtYear} onChange={(event) => updateForm("courtYear", event.target.value)} placeholder="Supreme Court / 2021" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input id="sourceUrl" value={form.sourceUrl} onChange={(event) => updateForm("sourceUrl", event.target.value)} placeholder="CourtListener, Oyez, official court source..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proposition">Proposition / issue supported</Label>
                <Textarea id="proposition" className="min-h-24" value={form.proposition} onChange={(event) => updateForm("proposition", event.target.value)} placeholder="What statement does this case support?" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="status">Verification status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Object.keys(statusMeta).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="strength">Authority strength</Label>
                  <select
                    id="strength"
                    value={form.strength}
                    onChange={(event) => updateForm("strength", event.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {(["Binding", "Persuasive", "Background", "Unknown"] as AuthorityStrength[]).map((strength) => (
                      <option key={strength} value={strength}>{strength}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button className="w-full" onClick={saveAuthority}>Save authority</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="text-2xl font-mono font-bold text-primary">{citations.length}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">saved authorities</div>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <div className="text-2xl font-mono font-bold text-emerald-500">{draftSafeCount}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">draft-safe verified</div>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4">
                  <div className="text-2xl font-mono font-bold text-destructive">{unverifiedCount}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">blocked pending verification</div>
                </CardContent>
              </Card>
            </div>

            {citations.map((citation) => {
              const meta = statusMeta[citation.status];
              return (
                <Card key={citation.id} className="overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-serif text-xl">{citation.caseName}</CardTitle>
                        <CardDescription className="font-mono mt-1">{citation.citation} · {citation.courtYear || "court/year not set"}</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={meta.className}>{citation.status}</Badge>
                        <Badge variant="outline">{citation.strength}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Proposition match</div>
                      <p className="text-sm leading-6">{citation.proposition || "No proposition entered yet."}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
                      <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline break-all">
                        <ExternalLink className="h-4 w-4 shrink-0" /> {citation.sourceUrl}
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => removeAuthority(citation.id)} aria-label={`Remove ${citation.caseName}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">{meta.description}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#D4A843]" /> Research Integrations Roadmap
            </CardTitle>
            <CardDescription>
              Google Scholar can be a manual research helper, but automated case-law infrastructure should start with CourtListener, RECAP, and Perplexity.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integrations.map((integration) => (
              <div key={integration} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                <Link2 className="h-4 w-4 text-primary" />
                {integration}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button disabled={unverifiedCount > 0}>
            {unverifiedCount > 0 ? `${unverifiedCount} citation(s) blocked — verify before draft placement` : "Authority ready for draft placement review"}
          </Button>
        </div>
      </div>
    </CaseLayout>
  );
}
