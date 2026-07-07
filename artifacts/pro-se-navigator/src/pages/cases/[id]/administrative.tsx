import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, FileText, MailCheck, ShieldCheck, TriangleAlert } from "lucide-react";

const rounds = [
  {
    label: "Round 1",
    title: "Notice / Dispute Letter",
    description: "Identify the issue, state the facts, dispute the conduct or error, and request correction or explanation.",
    evidence: "Creates the first record that the other side had notice.",
  },
  {
    label: "Round 2",
    title: "Opportunity to Cure",
    description: "Give a clear chance to fix the problem, restate what remains unresolved, and set a reasonable response window.",
    evidence: "Shows an attempted resolution before escalation.",
  },
  {
    label: "Round 3",
    title: "Intent to Escalate / Litigate",
    description: "Summarize the unresolved dispute and preserve that legal, administrative, or court remedies may be considered.",
    evidence: "Builds the pre-litigation record for later case organization.",
  },
];

const matterFits = [
  "Credit reporting / FCRA disputes",
  "Debt collection and validation disputes",
  "Contract breach and billing disputes",
  "Landlord repair, habitability, and deposit disputes",
  "Consumer-service disputes before court escalation",
];

export default function CaseAdministrativeProcess({ params }: { params: { id: string } }) {
  return (
    <CaseLayout caseId={params.id} title="Administrative Process Center">
      <div className="space-y-6">
        <Alert className="border-primary/30 bg-primary/5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertTitle className="font-serif">Optional pre-litigation record builder</AlertTitle>
          <AlertDescription>
            This workflow is not mandatory for every dispute. It helps users preserve a clean record of notice,
            opportunity to cure, responses, delivery proof, and unresolved issues before escalation.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {rounds.map((round) => (
            <Card key={round.label} className="bg-card/70 border-border/60 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10" />
              <CardHeader>
                <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-widest">{round.label}</Badge>
                <CardTitle className="font-serif text-xl">{round.title}</CardTitle>
                <CardDescription>{round.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">Record value:</span> {round.evidence}
                </div>
                <Button variant="outline" className="w-full" disabled>
                  <FileText className="mr-2 h-4 w-4" /> Draft generator coming next
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <MailCheck className="h-5 w-5 text-primary" /> Proof & Delivery Tracker
              </CardTitle>
              <CardDescription>
                Track certified mail, email, portal upload, hand delivery, response windows, and proof files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {["Delivery method", "Tracking number", "Date sent", "Response due date", "Response received", "Proof attachment"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary/70" /> {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#D4A843]/30 bg-[#D4A843]/5">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-[#D4A843]" /> When the app should suggest it
              </CardTitle>
              <CardDescription>
                The Navigator should suggest administrative process when a record of notice and attempted cure may help.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {matterFits.map((fit) => (
                <div key={fit} className="rounded-md bg-background/60 border border-border/60 px-3 py-2">{fit}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </CaseLayout>
  );
}
