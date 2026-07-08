import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowRight, CheckCircle2, CalendarClock, UploadCloud, FileText, Scale, FileSearch, Gavel, Handshake, FileStack, ClipboardList, BookOpenCheck, ShieldAlert, BrainCircuit, Swords, UserCheck, Mail, LibraryBig, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const steps = [
  { num: 1, label: "Case Info", href: "story", icon: FileText, desc: "Tell your story, set jurisdiction, check IFP eligibility" },
  { num: 2, label: "Evidence", href: "evidence", icon: UploadCloud, desc: "Upload documents, photos, letters, and records" },
  { num: 3, label: "Timeline", href: "timeline", icon: CalendarClock, desc: "Build your chronological case story" },
  { num: 4, label: "Drafts", href: "complaint", icon: FileSearch, desc: "Complaints, motions, letters, and demand drafts" },
  { num: 5, label: "Deadlines", href: "deadlines", icon: CalendarClock, desc: "Docket, response windows, and court dates" },
  { num: 6, label: "Discovery", href: "discovery", icon: FileSearch, desc: "Interrogatories, RFPs, RFAs, and subpoenas" },
  { num: 7, label: "Motions", href: "motions", icon: Swords, desc: "Track motions, orders, and response deadlines" },
  { num: 8, label: "Case Law", href: "case-law", icon: BookOpenCheck, desc: "Verify citations and build your authority bank" },
  { num: 9, label: "Risk Check", href: "procedural-risk", icon: ShieldAlert, desc: "Jurisdiction, standing, SOL, and pleading risks" },
  { num: 10, label: "Settlement", href: "settlement", icon: Handshake, desc: "Leverage tracker and resolution readiness" },
  { num: 11, label: "File & Serve", href: "service", icon: UserCheck, desc: "Service tracking and default readiness" },
  { num: 12, label: "More Tools", href: "playbooks", icon: LibraryBig, desc: "Playbooks, memory, agents, appeals, and packets" },
];

const moreTools = [
  { label: "Memory", href: "memory", icon: BrainCircuit },
  { label: "Draft Review", href: "draft-review", icon: Gavel },
  { label: "Admin Process", href: "administrative", icon: ClipboardList },
  { label: "Letters", href: "dispute-letter", icon: Mail },
  { label: "Packets", href: "documents", icon: FileStack },
  { label: "Appeals", href: "appeals", icon: Scale },
  { label: "Agents", href: "agents", icon: MessageSquare },
  { label: "Playbooks", href: "playbooks", icon: LibraryBig },
];

export default function CaseHome({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data, isLoading, error } = useGetCase(id, { query: { enabled: !isNaN(id), queryKey: getGetCaseQueryKey(id) } });

  if (isLoading) {
    return (
      <CaseLayout caseId={params.id} title="Loading...">
        <Skeleton className="h-64 w-full" />
      </CaseLayout>
    );
  }

  if (error || !data) {
    return (
      <CaseLayout caseId={params.id} title="Error">
        <Card className="bg-destructive/10 text-destructive border-destructive/20">
          <CardContent className="p-6 flex items-center">
            <AlertCircle className="h-6 w-6 mr-3" />
            Failed to load case data.
          </CardContent>
        </Card>
      </CaseLayout>
    );
  }

  const completedSections = [data.storyComplete, data.jurisdictionComplete, data.ifpComplete].filter(Boolean).length;
  const readinessPercent = Math.round((completedSections / 3) * 100);
  const openTasks = data.tasks?.filter((task) => !task.completed) ?? [];

  return (
    <CaseLayout caseId={params.id} title={data.title}>
      <div className="space-y-6">
        {/* Clean case header */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-2xl font-bold tracking-tight">{data.title}</h2>
          <Badge variant="outline" className="capitalize">{data.caseType}</Badge>
          <Badge variant="outline" className="capitalize border-primary/30 text-primary">{data.status}</Badge>
        </div>

        {/* Quick stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Court</div>
            <div className="font-medium mt-1 text-sm">{data.court || "Not set"}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Case #</div>
            <div className="font-mono mt-1 text-sm">{data.caseNumber || "TBD"}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Opposing</div>
            <div className="font-medium mt-1 text-sm truncate">{data.opposingParty || "Not set"}</div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Progress</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-mono font-bold text-primary">{readinessPercent}%</span>
              <Progress value={readinessPercent} className="h-1.5 flex-1" />
            </div>
          </div>
        </div>

        {/* TurboTax-style numbered step grid */}
        <div>
          <h3 className="text-lg font-bold font-serif tracking-tight mb-1">Build your case</h3>
          <p className="text-sm text-muted-foreground mb-4">Work through each step in order — or jump to what you need.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Link key={step.num} href={`/cases/${params.id}/${step.href}`}>
                  <Card className="group h-full cursor-pointer border-border/60 hover:border-primary/40 hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary font-bold font-mono text-sm shrink-0">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-sm">{step.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-5">{step.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* More tools — collapsed secondary tools */}
        <div>
          <h3 className="text-lg font-bold font-serif tracking-tight mb-1">More tools</h3>
          <p className="text-sm text-muted-foreground mb-4">Additional modules for deeper case work.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {moreTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={`/cases/${params.id}/${tool.href}`}>
                  <Card className="group h-full cursor-pointer border-border/60 hover:border-primary/40 transition-all">
                    <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs font-medium">{tool.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Next tasks — clean and simple */}
        {openTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-bold font-serif tracking-tight mb-3">Next steps</h3>
            <Card className="overflow-hidden">
              <div className="divide-y divide-border/50">
                {openTasks.slice(0, 5).map((task) => (
                  <Link key={task.id} href={`/cases/${params.id}/tasks`}>
                    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider">{task.phase}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </CaseLayout>
  );
}
