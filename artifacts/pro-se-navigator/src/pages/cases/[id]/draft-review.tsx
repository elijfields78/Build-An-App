import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { usePersistentState } from "@/hooks/usePersistentState";
import { AlertTriangle, BookOpenCheck, CheckCircle2, FileCheck2, Gavel, ListChecks, ShieldCheck } from "lucide-react";

type ReviewCheck = {
  id: string;
  label: string;
  detail: string;
  category: "Procedure" | "Facts" | "Evidence" | "Citations" | "Relief";
};

const checks: ReviewCheck[] = [
  { id: "jurisdiction", category: "Procedure", label: "Jurisdiction and venue stated", detail: "Draft identifies court power, venue facts, defendants, and forum connection." },
  { id: "elements", category: "Facts", label: "Facts mapped to legal elements", detail: "Every claim has supporting factual allegations, not just conclusions." },
  { id: "defendants", category: "Facts", label: "Each defendant tied to conduct", detail: "Avoid group pleading; connect dates, acts, omissions, and harms to each defendant." },
  { id: "evidence", category: "Evidence", label: "Evidence/exhibits referenced", detail: "Key allegations have supporting documents, screenshots, records, witnesses, or declarations." },
  { id: "citations", category: "Citations", label: "Case law verified", detail: "No fake or unverified citations enter the draft; propositions match the authority." },
  { id: "relief", category: "Relief", label: "Relief and damages supported", detail: "Demanded relief connects to injury, statute, damages, equitable relief, or declaratory relief." },
  { id: "jury", category: "Procedure", label: "Jury demand issue researched", detail: "Jury availability, deadline, waiver, and legal/equitable distinction reviewed." },
  { id: "service", category: "Procedure", label: "Service/default timeline considered", detail: "Summons, service method, response window, and default-readiness path identified." },
];

const categoryTone = {
  Procedure: "border-blue-400/40 text-blue-400 bg-blue-400/10",
  Facts: "border-primary/40 text-primary bg-primary/10",
  Evidence: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
  Citations: "border-purple-400/40 text-purple-400 bg-purple-400/10",
  Relief: "border-[#D4A843]/40 text-[#D4A843] bg-[#D4A843]/10",
} as const;

export default function DraftReviewCenter({ params }: { params: { id: string } }) {
  const [draftText, setDraftText] = usePersistentState<string>(`case:${params.id}:draft-review-text`, "");
  const [reviewed, setReviewed] = usePersistentState<Record<string, boolean>>(`case:${params.id}:draft-review-checks`, {});
  const complete = checks.filter((check) => reviewed[check.id]).length;
  const percent = Math.round((complete / checks.length) * 100);

  return (
    <CaseLayout caseId={params.id} title="Draft Review Center">
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Preflight before filing</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><FileCheck2 className="h-7 w-7 text-primary" /> Draft Review Command Center</CardTitle>
            <CardDescription className="max-w-3xl">
              Paste any complaint, answer, motion, opposition, affidavit, demand letter, or discovery response. Without API keys, this page gives a structured human review checklist. Later the Draft Review Agent will run these checks automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="flex justify-between text-sm mb-2"><span>Review completion</span><span className="font-mono font-bold">{percent}%</span></div>
              <Progress value={percent} className="h-2" />
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-3xl font-mono font-bold text-primary">{complete}/{checks.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">checks cleared</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><Gavel className="h-5 w-5 text-primary" /> Draft workspace</CardTitle>
              <CardDescription>Paste the current draft or notes for local review.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} className="min-h-[420px] font-mono text-xs" placeholder="Paste draft text here..." />
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-3">
            {checks.map((check) => (
              <label key={check.id} className="block cursor-pointer">
                <Card className={reviewed[check.id] ? "border-emerald-500/30 bg-emerald-500/5" : "bg-card/70"}>
                  <CardContent className="p-4 flex gap-4">
                    <input type="checkbox" className="mt-1" checked={!!reviewed[check.id]} onChange={() => setReviewed((current) => ({ ...current, [check.id]: !current[check.id] }))} />
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className={categoryTone[check.category]}>{check.category}</Badge>
                        {reviewed[check.id] && <Badge variant="outline" className="border-emerald-500/40 text-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Reviewed</Badge>}
                      </div>
                      <div className="font-serif text-lg">{check.label}</div>
                      <div className="text-sm text-muted-foreground leading-6 mt-1">{check.detail}</div>
                    </div>
                  </CardContent>
                </Card>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-destructive/20 bg-destructive/5"><CardContent className="p-4 text-sm"><AlertTriangle className="h-5 w-5 text-destructive mb-2" /> Block unverified citations before filing.</CardContent></Card>
          <Card className="border-purple-400/20 bg-purple-400/5"><CardContent className="p-4 text-sm"><BookOpenCheck className="h-5 w-5 text-purple-400 mb-2" /> Match authority to each legal proposition.</CardContent></Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="p-4 text-sm"><ShieldCheck className="h-5 w-5 text-emerald-500 mb-2" /> Review procedure, facts, proof, and relief.</CardContent></Card>
        </div>
      </div>
    </CaseLayout>
  );
}
