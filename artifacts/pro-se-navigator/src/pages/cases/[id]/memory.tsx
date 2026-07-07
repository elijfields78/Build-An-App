import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePersistentState } from "@/hooks/usePersistentState";
import { BrainCircuit, CalendarClock, FileText, Gavel, Link2, Plus, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

type MemoryBlock = {
  id: string;
  type: "Fact" | "Timeline" | "Evidence" | "Deadline" | "Authority" | "Draft";
  title: string;
  detail: string;
  status: "Captured" | "Needs proof" | "Needs verification" | "Draft-ready";
};

const seedMemory: MemoryBlock[] = [
  { id: "seed-fact", type: "Fact", title: "Core dispute theory", detail: "Summarize what happened, who did it, when it happened, and why it matters.", status: "Needs proof" },
  { id: "seed-deadline", type: "Deadline", title: "Response/default window", detail: "Track every response window from service, motions, orders, and discovery events.", status: "Needs verification" },
  { id: "seed-authority", type: "Authority", title: "Verified case law", detail: "Only verified authorities should move into filing drafts.", status: "Needs verification" },
];

const blockMeta = {
  Fact: { icon: FileText, tone: "text-primary" },
  Timeline: { icon: CalendarClock, tone: "text-blue-400" },
  Evidence: { icon: UploadCloud, tone: "text-emerald-500" },
  Deadline: { icon: Gavel, tone: "text-[#D4A843]" },
  Authority: { icon: ShieldCheck, tone: "text-purple-400" },
  Draft: { icon: BrainCircuit, tone: "text-pink-400" },
} as const;

export default function CaseMemory({ params }: { params: { id: string } }) {
  const [memory, setMemory] = usePersistentState<MemoryBlock[]>(`case:${params.id}:memory-blocks`, seedMemory);
  const [draft, setDraft] = usePersistentState<Omit<MemoryBlock, "id">>(`case:${params.id}:memory-draft`, {
    type: "Fact",
    title: "",
    detail: "",
    status: "Captured",
  });

  const addBlock = () => {
    if (!draft.title.trim()) return;
    setMemory((current) => [{ id: crypto.randomUUID(), ...draft }, ...current]);
    setDraft({ type: "Fact", title: "", detail: "", status: "Captured" });
  };

  const counts = {
    facts: memory.filter((item) => item.type === "Fact").length,
    evidence: memory.filter((item) => item.type === "Evidence").length,
    deadlines: memory.filter((item) => item.type === "Deadline").length,
    authorities: memory.filter((item) => item.type === "Authority").length,
  };

  return (
    <CaseLayout caseId={params.id} title="Case Memory Dashboard">
      <div className="space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">No-API memory layer</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3">
              <BrainCircuit className="h-7 w-7 text-primary" /> Case Memory Command Center
            </CardTitle>
            <CardDescription className="max-w-3xl">
              A structured memory board for the facts, timeline events, evidence, deadlines, authorities, and drafts the agents will later use. This works now without OpenAI, Anthropic, Perplexity, or database wiring.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Facts", counts.facts],
              ["Evidence", counts.evidence],
              ["Deadlines", counts.deadlines],
              ["Authorities", counts.authorities],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-3xl font-mono font-bold text-primary">{value}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Capture Memory</CardTitle>
              <CardDescription>Add structured case context the future agents can reason from.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Memory type</Label>
                <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as MemoryBlock["type"] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {Object.keys(blockMeta).map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Example: Defendant served on July 1" />
              </div>
              <div className="grid gap-2">
                <Label>Details</Label>
                <Textarea value={draft.detail} onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))} className="min-h-28" placeholder="Write the fact, document, deadline, authority, or draft note..." />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as MemoryBlock["status"] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {["Captured", "Needs proof", "Needs verification", "Draft-ready"].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <Button className="w-full" onClick={addBlock}>Add to case memory</Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-3">
            {memory.map((item) => {
              const Meta = blockMeta[item.type];
              const Icon = Meta.icon;
              return (
                <Card key={item.id} className="bg-card/70 border-border/60">
                  <CardContent className="p-4 flex gap-4">
                    <div className="rounded-xl border border-border/60 bg-background/70 h-11 w-11 flex items-center justify-center shrink-0">
                      <Icon className={`h-5 w-5 ${Meta.tone}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge variant="outline" className={item.status === "Draft-ready" ? "border-emerald-500/40 text-emerald-500" : item.status === "Needs verification" ? "border-[#D4A843]/40 text-[#D4A843]" : ""}>{item.status}</Badge>
                      </div>
                      <h3 className="font-serif text-lg mt-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-6 mt-1 whitespace-pre-wrap">{item.detail}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMemory((current) => current.filter((block) => block.id !== item.id))}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="border-[#D4A843]/30 bg-[#D4A843]/5">
          <CardContent className="p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <Link2 className="h-5 w-5 text-[#D4A843] shrink-0 mt-0.5" />
            Later, this page becomes the true case-memory layer: database-backed, searchable, and shared across Procedure, Evidence, Draft Review, Deadline, and Case Law agents.
          </CardContent>
        </Card>
      </div>
    </CaseLayout>
  );
}
