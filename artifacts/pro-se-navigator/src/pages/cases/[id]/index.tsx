import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, BrainCircuit, CalendarClock, CalendarDays, CheckCircle2, ClipboardList, FileCheck2, FileSearch, FileStack, Gavel, Handshake, LibraryBig, Scale, ShieldAlert, UploadCloud, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const commandModules = [
  { label: "Legal Playbooks", href: "playbooks", icon: LibraryBig, copy: "Matter-specific workflows for FCRA, FDCPA, landlord-tenant, contracts, civil rights, appeals, and general civil.", tone: "text-[#D4A843]" },
  { label: "Case Memory", href: "memory", icon: BrainCircuit, copy: "Facts, timeline, evidence, authorities, drafts, and deadlines in one memory layer.", tone: "text-primary" },
  { label: "Timeline", href: "timeline", icon: CalendarDays, copy: "Chronological events connecting facts, proof, admin letters, filings, deadlines, and settlement moments.", tone: "text-blue-400" },
  { label: "Procedural Risk", href: "procedural-risk", icon: ShieldAlert, copy: "Jurisdiction, venue, service, standing, SOL, exhaustion, Rule 12, and local-rule risks.", tone: "text-destructive" },
  { label: "Docket & Deadlines", href: "deadlines", icon: CalendarClock, copy: "Response windows, motion clocks, default-readiness signals, and docket activity.", tone: "text-[#D4A843]" },
  { label: "Service & Default", href: "service", icon: UserCheck, copy: "Track service targets, proof of service, response windows, appearances, and default-readiness checks.", tone: "text-destructive" },
  { label: "Discovery", href: "discovery", icon: FileSearch, copy: "Track interrogatories, RFPs, RFAs, subpoenas, depositions, disclosures, and discovery deadlines.", tone: "text-[#D4A843]" },
  { label: "Admin Process", href: "administrative", icon: ClipboardList, copy: "Notice, opportunity to cure, intent to escalate, delivery proof, and record building.", tone: "text-blue-400" },
  { label: "Case Law Bank", href: "case-law", icon: Scale, copy: "Authority storage, citation verification, proposition matching, and draft safety.", tone: "text-purple-400" },
  { label: "Draft Review", href: "draft-review", icon: FileCheck2, copy: "Preflight complaint, motion, answer, response, affidavit, and demand drafts.", tone: "text-emerald-500" },
  { label: "Document Packets", href: "documents", icon: FileStack, copy: "Assemble demand, complaint, motion response, evidence, and settlement packets.", tone: "text-purple-400" },
  { label: "Settlement Leverage", href: "settlement", icon: Handshake, copy: "Proof strength, damages, demand history, trial readiness, and resolution posture.", tone: "text-emerald-500" },
  { label: "Agent Orchestrator", href: "agents", icon: Gavel, copy: "Mock Procedure, Case Law, Evidence, Deadline, Draft Review, and Settlement agents.", tone: "text-primary" },
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
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="uppercase tracking-[0.3em] text-[10px]">Litigation war room</Badge>
              <Badge variant="outline" className="capitalize">{data.caseType}</Badge>
              <Badge variant="outline" className="capitalize border-primary/30 text-primary">{data.status}</Badge>
            </div>
            <CardTitle className="font-serif text-3xl md:text-4xl">{data.title}</CardTitle>
            <CardDescription className="max-w-4xl text-base">
              A command center for organizing the case, spotting procedural attacks, building the record, verifying authority, reviewing drafts, tracking deadlines, and preparing leverage for resolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Court</div>
              <div className="font-medium mt-1">{data.court || "Not specified"}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Case number</div>
              <div className="font-mono mt-1">{data.caseNumber || "TBD"}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Opposing party</div>
              <div className="font-medium mt-1">{data.opposingParty || "Not specified"}</div>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-3xl font-mono font-bold text-primary">{readinessPercent}%</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">filing readiness</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {commandModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link key={module.href} href={`/cases/${params.id}/${module.href}`} className="group block">
                    <Card className="h-full bg-card/70 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <Icon className={`h-5 w-5 ${module.tone}`} />
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardTitle className="font-serif text-lg">{module.label}</CardTitle>
                        <CardDescription className="text-xs leading-5">{module.copy}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg font-serif flex items-center gap-2"><FileSearch className="h-5 w-5 text-primary" /> Case Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Summary</div>
                  <div className="mt-2 text-foreground/80 leading-relaxed text-sm">{data.summary || "No summary added yet. Use Story Builder and Case Memory to structure the core facts."}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    ["Story Builder", data.storyComplete],
                    ["Jurisdiction", data.jurisdictionComplete],
                    ["IFP / Fees", data.ifpComplete],
                  ].map(([label, complete]) => (
                    <div key={String(label)} className="rounded-lg border border-border/60 bg-background/50 p-3 flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${complete ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                      <span className={complete ? "font-medium" : "text-muted-foreground"}>{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-mono font-bold tracking-tighter">{readinessPercent}%</span>
                </div>
                <Progress value={readinessPercent} className="h-1.5 mb-5 bg-primary/20 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground leading-5">Use Memory, Risk, Evidence, Case Law, and Draft Review to increase real litigation readiness beyond this basic completion score.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5" /> Next Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {openTasks.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">All caught up.</div>
                ) : (
                  <div className="divide-y divide-border/50 text-sm">
                    {openTasks.slice(0, 6).map((task) => (
                      <div key={task.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <p className="font-medium line-clamp-1">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5 uppercase font-mono tracking-wider">{task.phase}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Evidence</CardTitle>
                <UploadCloud className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0">
                {data.recentEvidence?.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No evidence uploaded yet.</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {data.recentEvidence?.slice(0, 4).map((ev) => (
                      <div key={ev.id} className="p-4">
                        <p className="font-medium text-sm line-clamp-1">{ev.fileName}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                          {format(new Date(ev.uploadedAt), "MMM dd, yyyy")} • {(ev.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CaseLayout>
  );
}
