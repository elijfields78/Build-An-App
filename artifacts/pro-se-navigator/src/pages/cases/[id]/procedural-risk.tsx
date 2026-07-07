import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePersistentState } from "@/hooks/usePersistentState";
import { AlertTriangle, CheckCircle2, Gavel, MapPin, Scale, ShieldAlert, TimerReset } from "lucide-react";

type RiskKey = "jurisdiction" | "venue" | "standing" | "service" | "limitations" | "exhaustion" | "pleading" | "localRules";
type RiskStatus = "Clear" | "Needs review" | "Urgent" | "Blocker";

type RiskItem = {
  key: RiskKey;
  label: string;
  attack: string;
  check: string;
  status: RiskStatus;
};

const defaultRisks: RiskItem[] = [
  { key: "jurisdiction", label: "Subject-matter jurisdiction", attack: "Rule 12(b)(1), no federal question/diversity, sovereign immunity", check: "Identify statute/constitutional basis, amount in controversy, citizenship, immunity issues.", status: "Needs review" },
  { key: "venue", label: "Venue & personal jurisdiction", attack: "Wrong court, wrong district, no contacts, improper venue", check: "Connect defendants, events, property, contracts, or business contacts to the forum.", status: "Needs review" },
  { key: "standing", label: "Standing / concrete harm", attack: "No injury-in-fact, no causation, no redressability", check: "Map each claim to concrete harm, dates, denial, money loss, emotional distress, or dissemination.", status: "Needs review" },
  { key: "service", label: "Service of process", attack: "Bad service, wrong entity, no proof, late service", check: "Track summons, served party, method, date, proof of service, answer deadline, entity rules.", status: "Urgent" },
  { key: "limitations", label: "Statute of limitations", attack: "Claims filed too late or accrual date wrong", check: "Capture incident date, discovery date, dispute date, tolling facts, and claim-specific limits.", status: "Needs review" },
  { key: "exhaustion", label: "Exhaustion / pre-suit notice", attack: "Required administrative process not completed", check: "Check EEOC, agency, grievance, notice-to-cure, dispute, CFPB, or statutory notice requirements.", status: "Needs review" },
  { key: "pleading", label: "Rule 8 / Twombly-Iqbal pleading", attack: "Labels, conclusions, group pleading, no plausible facts", check: "Tie every defendant to acts, dates, harm, legal element, and supporting evidence.", status: "Needs review" },
  { key: "localRules", label: "Local rules / judge orders", attack: "Wrong format, missed page limits, missed conference/order requirements", check: "Review local rules, standing orders, hearing rules, meet-and-confer rules, and formatting.", status: "Needs review" },
];

const statusClass: Record<RiskStatus, string> = {
  Clear: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  "Needs review": "border-blue-400/40 bg-blue-400/10 text-blue-400",
  Urgent: "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843]",
  Blocker: "border-destructive/40 bg-destructive/10 text-destructive",
};

const icons = [Scale, MapPin, ShieldAlert, TimerReset, AlertTriangle, Gavel, CheckCircle2, FileListIcon];
function FileListIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Gavel {...props} />;
}

export default function ProceduralRiskEngine({ params }: { params: { id: string } }) {
  const [risks, setRisks] = usePersistentState<RiskItem[]>(`case:${params.id}:procedural-risks`, defaultRisks);
  const clearCount = risks.filter((risk) => risk.status === "Clear").length;
  const blockerCount = risks.filter((risk) => risk.status === "Blocker" || risk.status === "Urgent").length;
  const health = Math.round((clearCount / risks.length) * 100);

  const updateStatus = (key: RiskKey, status: RiskStatus) => {
    setRisks((current) => current.map((risk) => risk.key === key ? { ...risk, status } : risk));
  };

  return (
    <CaseLayout caseId={params.id} title="Procedural Risk Engine">
      <div className="space-y-6">
        <Alert className="border-destructive/25 bg-destructive/5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <AlertTitle className="font-serif">Opposing counsel attack map</AlertTitle>
          <AlertDescription>
            This panel turns procedural defects into a visible checklist before the other side weaponizes them. It is legal-information support, not legal advice; users must verify rules, local rules, and court orders.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold text-primary">{health}%</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">procedural health</div>
              <Progress value={health} className="h-1.5" />
            </CardContent>
          </Card>
          <Card className="bg-[#D4A843]/5 border-[#D4A843]/20">
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold text-[#D4A843]">{blockerCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">urgent/blocker issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-4xl font-mono font-bold">{risks.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">procedural attack lanes</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {risks.map((risk, index) => {
            const Icon = icons[index] ?? Gavel;
            return (
              <Card key={risk.key} className="bg-card/70 border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-border/60 bg-background/70 h-11 w-11 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="font-serif text-lg">{risk.label}</CardTitle>
                        <CardDescription className="mt-1">{risk.attack}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusClass[risk.status]}>{risk.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">{risk.check}</div>
                  <select value={risk.status} onChange={(event) => updateStatus(risk.key, event.target.value as RiskStatus)} className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full">
                    {(["Clear", "Needs review", "Urgent", "Blocker"] as RiskStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </CaseLayout>
  );
}
