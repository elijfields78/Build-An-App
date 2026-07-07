import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePersistentState } from "@/hooks/usePersistentState";
import { AlertTriangle, Building2, CheckCircle2, ClipboardCheck, FileText, Home, Landmark, Scale, ShieldCheck, WalletCards } from "lucide-react";

type PlaybookId = "fcra" | "fdcpa" | "landlordTenant" | "contract" | "civilRights" | "smallClaims" | "appeals" | "generalCivil";

type Playbook = {
  id: PlaybookId;
  title: string;
  audience: string;
  icon: typeof Scale;
  positioning: string;
  intake: string[];
  evidence: string[];
  proceduralTraps: string[];
  draftTargets: string[];
  settlementSignals: string[];
};

const playbooks: Playbook[] = [
  {
    id: "fcra",
    title: "FCRA / Credit Reporting",
    audience: "Credit report errors, furnishers, CRAs, reinvestigation disputes",
    icon: WalletCards,
    positioning: "Build a dispute record, harm inventory, furnisher/CRA matrix, and verified authority trail before complaint drafting.",
    intake: ["Which bureau/furnisher reported the item?", "When was the dispute sent and how?", "What response did each bureau/furnisher provide?", "What concrete harm occurred?", "Was the information published to a third party?"],
    evidence: ["Credit reports before/after dispute", "Dispute letters", "Certified mail or portal proof", "Bureau responses", "Denial letters, higher-rate offers, damages proof"],
    proceduralTraps: ["Standing after Spokeo/TransUnion", "Furnisher notice through CRA", "Willfulness vs negligence", "Statute of limitations", "Failure to document actual harm"],
    draftTargets: ["Dispute letter", "CFPB complaint support", "Demand letter", "FCRA complaint outline", "Settlement packet"],
    settlementSignals: ["Repeated verification despite evidence", "Documented denial/harm", "Clear dispute chronology", "Verified statutory framework"],
  },
  {
    id: "fdcpa",
    title: "FDCPA / Debt Collection",
    audience: "Collectors, debt buyers, validation notices, collection lawsuits",
    icon: Building2,
    positioning: "Separate collector status, debt ownership, validation, communication violations, and collection-litigation defenses.",
    intake: ["Who is collecting and what is their role?", "Original creditor or debt buyer?", "When was validation notice received?", "What communications were made?", "Is there an active collection lawsuit?"],
    evidence: ["Collection letters", "Call logs", "Voicemails", "Texts/emails", "Debt validation requests", "Court complaint and exhibits"],
    proceduralTraps: ["Collector vs creditor status", "One-year limitations period", "Arbitration clauses", "State debt collection rules", "Debt ownership/proof gaps"],
    draftTargets: ["Debt validation letter", "Answer outline", "Discovery requests", "FDCPA complaint outline", "Settlement demand"],
    settlementSignals: ["Bad documentation", "Time-barred debt concerns", "Communication violations", "Weak chain of title"],
  },
  {
    id: "landlordTenant",
    title: "Landlord-Tenant",
    audience: "Repairs, habitability, eviction defense, deposits, retaliation",
    icon: Home,
    positioning: "Organize notices, photos, rent ledger, repair timeline, lease terms, and hearing deadlines.",
    intake: ["What type of dispute: repair, eviction, deposit, retaliation?", "What notices were sent/received?", "What lease terms matter?", "What dates are tied to rent, repairs, entry, or hearing?", "What relief is needed?"],
    evidence: ["Lease", "Photos/videos", "Repair requests", "Texts/emails", "Rent ledger", "Inspection reports", "Notices to quit/pay/vacate"],
    proceduralTraps: ["Short eviction deadlines", "Improper notice", "Rent escrow rules", "Local housing code requirements", "Failure to appear"],
    draftTargets: ["Notice/cure letter", "Answer/defense outline", "Evidence packet", "Hearing prep sheet", "Settlement proposal"],
    settlementSignals: ["Documented notice", "Health/safety proof", "Rent ledger clarity", "Retaliation timing"],
  },
  {
    id: "contract",
    title: "Contract Disputes",
    audience: "Breach, services, payments, performance, business/customer disputes",
    icon: FileText,
    positioning: "Map agreement formation, obligations, breach, notice, damages, defenses, and proof of performance.",
    intake: ["Was there a written, oral, or implied agreement?", "What promise was breached?", "What performance did each side owe?", "What notice/cure happened?", "What damages are provable?"],
    evidence: ["Contract", "Invoices", "Payment records", "Emails/texts", "Change orders", "Photos", "Delivery/performance proof"],
    proceduralTraps: ["Statute of frauds", "Limitations period", "Arbitration/venue clause", "Damages speculation", "Failure to mitigate"],
    draftTargets: ["Demand letter", "Breach timeline", "Damages worksheet", "Complaint outline", "Settlement term sheet"],
    settlementSignals: ["Clear contract language", "Documented breach", "Clean damages math", "Notice/cure record"],
  },
  {
    id: "civilRights",
    title: "Civil Rights / §1983",
    audience: "State actors, constitutional violations, municipal liability, force/search/due process",
    icon: ShieldCheck,
    positioning: "Carefully map state action, right violated, personal involvement, municipal policy/custom, immunity issues, and concrete harm.",
    intake: ["Who acted under color of state law?", "What constitutional/statutory right was violated?", "What did each defendant personally do?", "Is a municipality involved?", "What injuries/damages occurred?"],
    evidence: ["Bodycam/videos", "Reports", "Witness statements", "Medical records", "Policies/custom evidence", "Complaints/grievances"],
    proceduralTraps: ["Qualified immunity", "Monell policy/custom", "Personal involvement", "Heck doctrine", "Exhaustion/notice", "Pleading conclusions"],
    draftTargets: ["Incident chronology", "Defendant matrix", "Monell theory worksheet", "Complaint outline", "Discovery plan"],
    settlementSignals: ["Strong video/document proof", "Clear right violated", "Pattern/custom evidence", "Damages documentation"],
  },
  {
    id: "smallClaims",
    title: "Small Claims / General Local Civil",
    audience: "Lower-dollar disputes, local court claims, consumer/property/service cases",
    icon: Landmark,
    positioning: "Simplify claims into judge-ready facts, documents, damages, hearing story, and service proof.",
    intake: ["What amount is claimed?", "What happened in plain language?", "What documents prove it?", "Was demand made before filing?", "How will service/hearing work?"],
    evidence: ["Receipts", "Contracts", "Photos", "Texts/emails", "Demand letter", "Witness notes", "Damages math"],
    proceduralTraps: ["Wrong defendant name", "Wrong court/venue", "Service defects", "Hearing evidence rules", "Amount exceeds limit"],
    draftTargets: ["Demand letter", "Claim form outline", "Hearing script", "Exhibit list", "Settlement proposal"],
    settlementSignals: ["Clean exhibits", "Simple damages", "Pre-suit demand", "Clear defendant identity"],
  },
  {
    id: "appeals",
    title: "Appeals",
    audience: "Notice of appeal, record preservation, appellate deadlines, issue statements",
    icon: Scale,
    positioning: "Track appeal clocks, final order/judgment status, preserved issues, record citations, and standard of review.",
    intake: ["What order/judgment is being appealed?", "When was it entered?", "Was the issue preserved below?", "What standard of review applies?", "What relief is requested?"],
    evidence: ["Judgment/order", "Docket sheet", "Transcript", "Motions/objections", "Exhibits", "Notice of appeal proof"],
    proceduralTraps: ["Notice deadline", "Finality", "Record omissions", "Issue waiver", "Brief formatting/local rules", "Standard of review"],
    draftTargets: ["Notice deadline tracker", "Issue list", "Record citation map", "Brief outline", "Appendix checklist"],
    settlementSignals: ["Preserved reversible error", "Clean record", "High cost of appeal", "Narrow issue framing"],
  },
  {
    id: "generalCivil",
    title: "Federal / State Civil General",
    audience: "Broad civil plaintiff/defendant workflow before matter-specific narrowing",
    icon: ClipboardCheck,
    positioning: "Baseline civil litigation framework: jurisdiction, parties, claims/defenses, service, motions, discovery, settlement, trial, appeal.",
    intake: ["Plaintiff, defendant, or research posture?", "Court system?", "Claims/defenses?", "Service and deadline status?", "Desired outcome?"],
    evidence: ["Pleadings", "Orders", "Docket", "Contracts/records", "Communications", "Damages proof"],
    proceduralTraps: ["Rule 12", "Service", "Standing", "Venue", "Discovery deadlines", "Summary judgment evidence", "Local rules"],
    draftTargets: ["Complaint/answer outline", "Motion response outline", "Discovery plan", "Settlement packet", "Trial prep checklist"],
    settlementSignals: ["Procedural cleanliness", "Evidence-to-element proof", "Deadline discipline", "Verified authority"],
  },
];

export default function LegalPlaybookCenter({ params }: { params: { id: string } }) {
  const [activeId, setActiveId] = usePersistentState<PlaybookId>(`case:${params.id}:active-playbook`, "generalCivil");
  const [checked, setChecked] = usePersistentState<Record<string, boolean>>(`case:${params.id}:playbook-checks`, {});
  const active = playbooks.find((playbook) => playbook.id === activeId) ?? playbooks[0];
  const totalItems = active.intake.length + active.evidence.length + active.proceduralTraps.length + active.draftTargets.length;
  const checkedCount = Object.entries(checked).filter(([key, value]) => key.startsWith(active.id) && value).length;
  const progress = Math.round((checkedCount / totalItems) * 100);
  const ActiveIcon = active.icon;

  const checklist = [
    { title: "Intake prompts", items: active.intake, tone: "text-primary" },
    { title: "Evidence checklist", items: active.evidence, tone: "text-emerald-500" },
    { title: "Procedural traps", items: active.proceduralTraps, tone: "text-destructive" },
    { title: "Draft targets", items: active.draftTargets, tone: "text-[#D4A843]" },
  ];

  const toggle = (key: string) => setChecked((current) => ({ ...current, [key]: !current[key] }));

  return (
    <CaseLayout caseId={params.id} title="Legal Playbook Center">
      <div className="space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Matter-specific operating system</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><ActiveIcon className="h-7 w-7 text-primary" /> {active.title}</CardTitle>
            <CardDescription className="max-w-3xl">{active.positioning}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="flex justify-between text-sm mb-2"><span>Playbook completion</span><span className="font-mono font-bold">{progress}%</span></div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-3xl font-mono font-bold text-primary">{checkedCount}/{totalItems}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">items reviewed</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif">Choose playbook</CardTitle>
              <CardDescription>Pick the workflow that fits the dispute. This does not force a legal classification; it organizes the work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {playbooks.map((playbook) => {
                const Icon = playbook.icon;
                const selected = playbook.id === active.id;
                return (
                  <button key={playbook.id} onClick={() => setActiveId(playbook.id)} className={`w-full rounded-lg border p-3 text-left transition ${selected ? "border-primary/40 bg-primary/10" : "border-border/60 bg-background/50 hover:bg-accent/40"}`}>
                    <div className="flex items-center gap-2 font-bold text-sm"><Icon className="h-4 w-4 text-primary" /> {playbook.title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-5">{playbook.audience}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="xl:col-span-3 space-y-4">
            {checklist.map((section) => (
              <Card key={section.title}>
                <CardHeader className="pb-3">
                  <CardTitle className={`font-serif flex items-center gap-2 ${section.tone}`}><CheckCircle2 className="h-5 w-5" /> {section.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {section.items.map((item) => {
                    const key = `${active.id}:${section.title}:${item}`;
                    return (
                      <label key={key} className="flex items-start gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)} className="mt-1" />
                        <span className={checked[key] ? "line-through text-muted-foreground" : "text-foreground"}>{item}</span>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" /> Settlement / resolution signals</CardTitle>
                <CardDescription>Signals this playbook should capture to improve resolution posture while remaining prepared for litigation.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {active.settlementSignals.map((signal) => (
                  <div key={signal} className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm">{signal}</div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-[#D4A843]/30 bg-[#D4A843]/5">
          <CardContent className="p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-[#D4A843] shrink-0 mt-0.5" />
            Playbooks are organization and legal-information workflows. They do not determine claims, guarantee outcomes, or replace attorney review. Users must verify jurisdiction-specific rules, deadlines, forms, and authority.
          </CardContent>
        </Card>
      </div>
    </CaseLayout>
  );
}
