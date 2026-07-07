import { useMemo } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ClipboardCopy, FileText, MailCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { usePersistentState } from "@/hooks/usePersistentState";

const matterFits = [
  "Credit reporting / FCRA disputes",
  "Debt collection and validation disputes",
  "Contract breach and billing disputes",
  "Landlord repair, habitability, and deposit disputes",
  "Consumer-service disputes before court escalation",
];

type AdminForm = {
  senderName: string;
  recipientName: string;
  recipientRole: string;
  issueSummary: string;
  requestedCure: string;
  evidenceList: string;
  responseDays: string;
  deliveryMethod: string;
};

const defaultForm: AdminForm = {
  senderName: "",
  recipientName: "",
  recipientRole: "",
  issueSummary: "The issue remains unresolved and requires written correction, explanation, or cure.",
  requestedCure: "Please correct the issue, provide written confirmation, and preserve all records related to this dispute.",
  evidenceList: "Prior correspondence, account records, screenshots, notices, agreements, credit reports, receipts, and delivery proof.",
  responseDays: "14",
  deliveryMethod: "Certified mail / email / portal upload",
};

function buildLetters(form: AdminForm) {
  const sender = form.senderName || "[Your Name]";
  const recipient = form.recipientName || "[Recipient / Company]";
  const role = form.recipientRole ? ` (${form.recipientRole})` : "";
  const days = form.responseDays || "14";
  const issue = form.issueSummary || "[Describe the dispute or unresolved issue]";
  const cure = form.requestedCure || "[Describe the specific correction or cure requested]";
  const evidence = form.evidenceList || "[List supporting evidence and proof]";
  const delivery = form.deliveryMethod || "[Delivery method]";

  return [
    {
      title: "Round 1 — Notice / Dispute Letter",
      purpose: "Give notice of the issue and create the first written record.",
      text: `To: ${recipient}${role}\nFrom: ${sender}\nRe: Notice and dispute of unresolved issue\n\nThis letter is sent to provide written notice of a disputed issue and to request correction, explanation, or resolution.\n\nIssue summary:\n${issue}\n\nRequested cure or correction:\n${cure}\n\nSupporting records currently identified:\n${evidence}\n\nPlease respond in writing within ${days} days of receipt. This communication is intended to preserve a record of notice and attempted resolution.\n\nDelivery / proof method: ${delivery}\n\nThis letter is for record-preservation and dispute-resolution purposes. All rights and remedies are reserved.`,
    },
    {
      title: "Round 2 — Opportunity to Cure",
      purpose: "Show that the other side had a fair opportunity to fix the problem.",
      text: `To: ${recipient}${role}\nFrom: ${sender}\nRe: Opportunity to cure unresolved dispute\n\nThis letter follows prior notice regarding the unresolved issue described below. I am providing an additional opportunity to cure or resolve the matter before further escalation is considered.\n\nUnresolved issue:\n${issue}\n\nRequested cure:\n${cure}\n\nEvidence / record materials:\n${evidence}\n\nPlease provide written confirmation of your position and any cure within ${days} days of receipt. If you contend the issue is already resolved or that no cure is required, please provide the factual and documentary basis for that position.\n\nDelivery / proof method: ${delivery}\n\nThis correspondence is intended to document a good-faith attempt to resolve the matter before escalation.`,
    },
    {
      title: "Round 3 — Intent to Escalate / Litigate",
      purpose: "Preserve that notice and cure opportunities were given before escalation.",
      text: `To: ${recipient}${role}\nFrom: ${sender}\nRe: Final notice of unresolved dispute and potential escalation\n\nThis letter summarizes the unresolved dispute and the prior opportunities provided to resolve or cure the issue.\n\nIssue summary:\n${issue}\n\nRequested cure that remains unresolved:\n${cure}\n\nEvidence and record materials:\n${evidence}\n\nBecause the matter remains unresolved, I may consider available legal, administrative, regulatory, or court remedies. This letter is sent to preserve a record of my effort to resolve the matter before escalation.\n\nPlease provide any final written response within ${days} days of receipt.\n\nDelivery / proof method: ${delivery}\n\nNothing in this letter should be understood as legal advice or a waiver of any rights, claims, defenses, or remedies.`,
    },
  ];
}

export default function CaseAdministrativeProcess({ params }: { params: { id: string } }) {
  const [form, setForm] = usePersistentState<AdminForm>(`case:${params.id}:administrative-process`, defaultForm);
  const letters = useMemo(() => buildLetters(form), [form]);

  const updateField = (field: keyof AdminForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const copyLetter = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Letter copied to clipboard");
  };

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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit border-primary/20 bg-card/80">
            <CardHeader>
              <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-widest">Record builder</Badge>
              <CardTitle className="font-serif text-2xl">Dispute details</CardTitle>
              <CardDescription>
                Fill this once. The Navigator creates three escalation-ready draft letters from the same record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="senderName">Sender name</Label>
                <Input id="senderName" value={form.senderName} onChange={(event) => updateField("senderName", event.target.value)} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipientName">Recipient / company</Label>
                <Input id="recipientName" value={form.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} placeholder="Company or opposing party" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipientRole">Recipient role</Label>
                <Input id="recipientRole" value={form.recipientRole} onChange={(event) => updateField("recipientRole", event.target.value)} placeholder="Furnisher, landlord, collector, contractor..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueSummary">Issue summary</Label>
                <Textarea id="issueSummary" className="min-h-24" value={form.issueSummary} onChange={(event) => updateField("issueSummary", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="requestedCure">Requested cure</Label>
                <Textarea id="requestedCure" className="min-h-24" value={form.requestedCure} onChange={(event) => updateField("requestedCure", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evidenceList">Evidence / proof list</Label>
                <Textarea id="evidenceList" className="min-h-24" value={form.evidenceList} onChange={(event) => updateField("evidenceList", event.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="responseDays">Response days</Label>
                  <Input id="responseDays" value={form.responseDays} onChange={(event) => updateField("responseDays", event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deliveryMethod">Delivery proof</Label>
                  <Input id="deliveryMethod" value={form.deliveryMethod} onChange={(event) => updateField("deliveryMethod", event.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            {letters.map((letter, index) => (
              <Card key={letter.title} className="bg-card/70 border-border/60 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10" />
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-widest">Round {index + 1}</Badge>
                      <CardTitle className="font-serif text-xl mt-3">{letter.title}</CardTitle>
                      <CardDescription>{letter.purpose}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void copyLetter(letter.text)}>
                      <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border/70 bg-background/70 p-4 text-sm leading-6 text-foreground/90">
                    {letter.text}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
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

        <Alert className="border-muted bg-muted/30">
          <FileText className="h-4 w-4" />
          <AlertTitle className="font-serif">Legal-information guardrail</AlertTitle>
          <AlertDescription>
            These are educational draft templates and record-organization tools, not legal advice. Users must verify facts,
            deadlines, statutory notice requirements, and court rules before using any correspondence or filing.
          </AlertDescription>
        </Alert>
      </div>
    </CaseLayout>
  );
}
