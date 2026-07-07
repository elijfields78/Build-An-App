import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Archive, BookOpenCheck, CheckCircle2, ClipboardList, FileStack, FileText, Gavel, Handshake, PackageCheck, ShieldCheck } from "lucide-react";

type PacketId = "demand" | "complaint" | "motionResponse" | "evidence" | "settlement";

type Packet = {
  id: PacketId;
  title: string;
  purpose: string;
  icon: typeof FileStack;
  items: string[];
  warnings: string[];
};

const packets: Packet[] = [
  {
    id: "demand",
    title: "Demand / Administrative Record Packet",
    purpose: "Show notice, opportunity to cure, evidence, damages, and attempted resolution before litigation.",
    icon: ClipboardList,
    items: ["Round 1 notice/dispute letter", "Round 2 opportunity-to-cure letter", "Round 3 intent-to-escalate letter", "Delivery proof", "Response/no-response log", "Evidence index", "Damages worksheet", "Settlement request"],
    warnings: ["Do not threaten unsupported claims.", "Verify any statutory notice language.", "Keep proof of delivery and responses."],
  },
  {
    id: "complaint",
    title: "Complaint Filing Packet",
    purpose: "Organize the documents and checks needed before filing a civil complaint.",
    icon: FileText,
    items: ["Complaint draft", "Civil cover sheet if applicable", "Summons for each defendant", "Exhibit list", "Jurisdiction/venue memo", "Case law/citation review", "IFP/fee decision", "Service plan"],
    warnings: ["Verify court forms and local rules.", "Block unverified citations.", "Confirm defendant names and service addresses."],
  },
  {
    id: "motionResponse",
    title: "Motion Response Packet",
    purpose: "Prepare an organized response to motions to dismiss, summary judgment, discovery motions, or court orders.",
    icon: Gavel,
    items: ["Motion summary", "Response deadline verification", "Arguments/issues list", "Fact/evidence support", "Verified authority list", "Declaration/affidavit support", "Proposed order if required", "Certificate of service"],
    warnings: ["Verify response deadline from rule/order/local rules.", "Address each argument raised.", "Do not rely on unverified cases or quotes."],
  },
  {
    id: "evidence",
    title: "Evidence / Exhibit Packet",
    purpose: "Turn uploaded proof into a clean exhibit-ready package.",
    icon: Archive,
    items: ["Exhibit index", "Fact-to-exhibit map", "Timeline references", "Witness/source notes", "Authenticity notes", "Damages documents", "Missing proof list", "Trial/hearing exhibit checklist"],
    warnings: ["Keep originals preserved.", "Check admissibility/authentication rules.", "Redact sensitive information where required."],
  },
  {
    id: "settlement",
    title: "Settlement Leverage Packet",
    purpose: "Summarize why resolution makes sense while staying prepared for full litigation.",
    icon: Handshake,
    items: ["Case summary", "Administrative record", "Evidence index", "Damages calculation", "Procedural posture", "Authority summary", "Settlement demand/options", "Deadline for response"],
    warnings: ["Avoid guarantees or threats.", "Support every number.", "Keep the tone professional and settlement-oriented."],
  },
];

export default function DocumentAssemblyCenter({ params }: { params: { id: string } }) {
  const [activeId, setActiveId] = usePersistentState<PacketId>(`case:${params.id}:active-packet`, "demand");
  const [checked, setChecked] = usePersistentState<Record<string, boolean>>(`case:${params.id}:packet-checks`, {});
  const active = packets.find((packet) => packet.id === activeId) ?? packets[0];
  const complete = active.items.filter((item) => checked[`${active.id}:${item}`]).length;
  const progress = Math.round((complete / active.items.length) * 100);
  const ActiveIcon = active.icon;

  return (
    <CaseLayout caseId={params.id} title="Document Assembly Center">
      <div className="space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">Packet builder</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><ActiveIcon className="h-7 w-7 text-primary" /> {active.title}</CardTitle>
            <CardDescription className="max-w-3xl">{active.purpose}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="flex justify-between text-sm mb-2"><span>Packet readiness</span><span className="font-mono font-bold">{progress}%</span></div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-3xl font-mono font-bold text-primary">{complete}/{active.items.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">packet items</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><FileStack className="h-5 w-5 text-primary" /> Packet type</CardTitle>
              <CardDescription>Choose the package the user is preparing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {packets.map((packet) => {
                const Icon = packet.icon;
                const selected = packet.id === active.id;
                return (
                  <button key={packet.id} onClick={() => setActiveId(packet.id)} className={`w-full rounded-lg border p-3 text-left transition ${selected ? "border-primary/40 bg-primary/10" : "border-border/60 bg-background/50 hover:bg-accent/40"}`}>
                    <div className="flex items-center gap-2 font-bold text-sm"><Icon className="h-4 w-4 text-primary" /> {packet.title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-5">{packet.purpose}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="xl:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2"><PackageCheck className="h-5 w-5 text-emerald-500" /> Assembly checklist</CardTitle>
                <CardDescription>Use this as a local packet-prep checklist until database and document generation are wired.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {active.items.map((item) => {
                  const key = `${active.id}:${item}`;
                  return (
                    <label key={key} className="flex items-start gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={!!checked[key]} onChange={() => setChecked((current) => ({ ...current, [key]: !current[key] }))} className="mt-1" />
                      <span className={checked[key] ? "line-through text-muted-foreground" : "text-foreground"}>{item}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {active.warnings.map((warning) => (
                <Card key={warning} className="border-[#D4A843]/30 bg-[#D4A843]/5">
                  <CardContent className="p-4 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 text-[#D4A843] mb-2" />{warning}</CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-purple-400/20 bg-purple-400/5">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-purple-400" /> Future agent workflow</CardTitle>
                <CardDescription>Once APIs are active, the assembler can pull from case memory, timeline, evidence, admin process, docket, draft review, and case law bank to generate a structured packet.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </CaseLayout>
  );
}
