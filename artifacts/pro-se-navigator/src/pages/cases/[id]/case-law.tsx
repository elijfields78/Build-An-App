import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenCheck, Link2, ShieldAlert, Sparkles, Scale } from "lucide-react";

const citationStatuses = [
  { label: "Verified", tone: "text-emerald-500", description: "Case exists and source link/citation are confirmed." },
  { label: "Partially verified", tone: "text-[#D4A843]", description: "Source found, but proposition or treatment still needs review." },
  { label: "Research lead only", tone: "text-blue-400", description: "Useful lead, but not safe for filing drafts yet." },
  { label: "Unverified — do not file", tone: "text-destructive", description: "Blocked from final drafting until independently verified." },
];

const integrations = [
  "CourtListener / Free Law Project API",
  "RECAP docket and filing archive",
  "Perplexity cited research workflow",
  "Manual citation / Google Scholar link import",
  "Future Westlaw, Lexis, Fastcase, or Casetext-style provider adapter",
];

export default function CaseLawBank({ params }: { params: { id: string } }) {
  return (
    <CaseLayout caseId={params.id} title="Case Law Bank">
      <div className="space-y-6">
        <Alert className="border-destructive/30 bg-destructive/5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <AlertTitle className="font-serif">Citation hallucination guardrail</AlertTitle>
          <AlertDescription>
            Pro Se Navigator should never silently place unverified case law into a filing draft. Every authority should be
            source-linked, proposition-checked, and labeled before use.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 overflow-hidden">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-primary" /> Verified Authority Workspace
              </CardTitle>
              <CardDescription>
                Save cases, attach them to legal issues, verify their source, and decide whether they support the proposition.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {["Case name and citation", "Court, year, and jurisdiction", "Legal issue / proposition", "Source URL", "Binding or persuasive status", "Negative-treatment check", "Draft placement review"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-4 py-3">
                  <span className="text-sm font-medium">{item}</span>
                  <Badge variant="outline">schema ready</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Citation Agent Chain
              </CardTitle>
              <CardDescription>Research → verify → proposition match → draft safety.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {citationStatuses.map((status) => (
                <div key={status.label} className="rounded-md border border-border/60 bg-background/60 p-3">
                  <div className={`font-bold ${status.tone}`}>{status.label}</div>
                  <div className="text-muted-foreground mt-1">{status.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>
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
          <Button disabled>
            Connect CourtListener / RECAP next
          </Button>
        </div>
      </div>
    </CaseLayout>
  );
}
