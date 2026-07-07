import { CaseLayout } from "@/components/layout/CaseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePersistentState } from "@/hooks/usePersistentState";
import { BrainCircuit, CalendarClock, ClipboardList, FileSearch, Gavel, Play, Scale, ShieldCheck, Sparkles } from "lucide-react";

type AgentRun = {
  id: string;
  agent: string;
  mission: string;
  output: string;
  status: "Queued" | "Mock complete" | "Needs API";
};

const agents = [
  { name: "Procedure Agent", icon: CalendarClock, mission: "Scan deadlines, service, Rule 12 risks, local-rule issues, and default-readiness." },
  { name: "Case Law Agent", icon: Scale, mission: "Identify research propositions and separate verified authority from research leads." },
  { name: "Evidence Agent", icon: ShieldCheck, mission: "Map facts to exhibits, missing proof, witnesses, and evidentiary weaknesses." },
  { name: "Admin Process Agent", icon: ClipboardList, mission: "Build notice/cure/escalation record and proof-of-delivery plan." },
  { name: "Draft Review Agent", icon: FileSearch, mission: "Preflight drafts for unsupported claims, procedural defects, and citation risk." },
  { name: "Settlement Leverage Agent", icon: Gavel, mission: "Surface pressure points, damages proof, trial-readiness gaps, and resolution posture." },
];

function mockOutput(agent: string, mission: string, caseNotes: string) {
  return `${agent} mock run\n\nMission: ${mission}\n\nContext reviewed: ${caseNotes.trim() || "No case notes entered yet."}\n\nNext no-API output:\n• Identify missing fields the user should capture.\n• Save structured notes into case memory.\n• Route user to the right module for deeper work.\n\nAPI phase output later:\n• Pull case memory, drafts, evidence, deadlines, and authorities.\n• Use model/provider routing.\n• Return verified, citation-aware, legally safe recommendations.`;
}

export default function AgentOrchestrator({ params }: { params: { id: string } }) {
  const [caseNotes, setCaseNotes] = usePersistentState<string>(`case:${params.id}:agent-notes`, "");
  const [runs, setRuns] = usePersistentState<AgentRun[]>(`case:${params.id}:agent-runs`, []);

  const runAgent = (agent: (typeof agents)[number]) => {
    setRuns((current) => [{
      id: crypto.randomUUID(),
      agent: agent.name,
      mission: agent.mission,
      output: mockOutput(agent.name, agent.mission, caseNotes),
      status: "Mock complete",
    }, ...current]);
  };

  return (
    <CaseLayout caseId={params.id} title="Navigator Agent Orchestrator">
      <div className="space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit uppercase tracking-[0.3em] text-[10px]">No-API multi-agent control room</Badge>
            <CardTitle className="font-serif text-3xl flex items-center gap-3"><BrainCircuit className="h-7 w-7 text-primary" /> Agent Orchestrator</CardTitle>
            <CardDescription className="max-w-3xl">
              This is the skeleton of the Perplexity Computer-style litigation operator: specialized agents, shared case memory, tactical workflows, and provider-ready execution. It runs mock outputs now and becomes live once API keys are wired.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-background/60 border-border/60 md:col-span-2"><CardContent className="p-4"><Textarea value={caseNotes} onChange={(event) => setCaseNotes(event.target.value)} className="min-h-28" placeholder="Add case context for the agents to use in this session..." /></CardContent></Card>
            <Card className="bg-background/60 border-border/60"><CardContent className="p-4"><div className="text-3xl font-mono font-bold text-primary">{runs.length}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">agent runs logged</div></CardContent></Card>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card key={agent.name} className="bg-card/70 border-border/60">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {agent.name}</CardTitle>
                  <CardDescription>{agent.mission}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => runAgent(agent)}><Play className="h-4 w-4 mr-2" /> Run mock agent</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <CardTitle className="font-serif flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> {run.agent}</CardTitle>
                    <CardDescription>{run.mission}</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">{run.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-background/70 p-4 text-sm leading-6">{run.output}</pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CaseLayout>
  );
}
