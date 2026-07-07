import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarClock, Clock3, FileWarning, Gavel, UploadCloud } from "lucide-react";

const docketRows = [
  { doc: "Doc 12", type: "Motion to Dismiss", filedBy: "Opposing Party", response: "Likely response required", workflow: "Rule 12 Response" },
  { doc: "Doc 13", type: "Order", filedBy: "Court", response: "Verify deadline/order text", workflow: "Docket Review" },
  { doc: "Doc 14", type: "Proof of Service", filedBy: "User", response: "May trigger answer/default clock", workflow: "Default Readiness" },
];

const timers = [
  "Opposing party answer/response window",
  "Motion response deadline",
  "Discovery response deadline",
  "Jury demand deadline issue to verify",
  "Default/default judgment readiness review",
  "Appeal / reconsideration deadline issue to verify",
];

export default function CaseDocketDeadlines({ params }: { params: { id: string } }) {
  return (
    <CaseLayout caseId={params.id} title="Docket & Deadline Intelligence">
      <div className="space-y-6">
        <Alert className="border-[#D4A843]/30 bg-[#D4A843]/5">
          <CalendarClock className="h-4 w-4 text-[#D4A843]" />
          <AlertTitle className="font-serif">Procedural timing command center</AlertTitle>
          <AlertDescription>
            This module is designed to track user deadlines, opposing-party response windows, PACER/RECAP docket activity,
            default-readiness signals, and court-order response tasks. All calculated deadlines must be verified against court rules,
            orders, local rules, and the docket.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" /> Docket Activity Table
              </CardTitle>
              <CardDescription>
                PACER/RECAP imports and manual docket uploads should flow into this response-tracking table.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {docketRows.map((row) => (
                <div key={row.doc} className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-lg border border-border/60 bg-card/60 p-4 text-sm">
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
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Response</div>
                    <div>{row.response}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Workflow</div>
                    <Badge variant="outline">{row.workflow}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" /> Deadline Timers
              </CardTitle>
              <CardDescription>High-risk clocks the app should monitor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {timers.map((timer) => (
                <div key={timer} className="flex items-center gap-2 rounded-md bg-background/60 border border-border/60 px-3 py-2 text-sm">
                  <Clock3 className="h-4 w-4 text-[#D4A843]" /> {timer}
                </div>
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
              First version: upload docket PDFs, NEF emails, orders, and motion PDFs. Next version: RECAP lookup. Direct PACER login comes later with fee warnings and user consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            {[
              "Manual docket upload",
              "NEF/email parser",
              "RECAP public lookup",
              "Direct PACER later",
            ].map((step) => (
              <div key={step} className="rounded-lg border border-border/60 bg-background/50 p-4 font-medium">{step}</div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button disabled>
            Upload docket parser coming next
          </Button>
        </div>
      </div>
    </CaseLayout>
  );
}
