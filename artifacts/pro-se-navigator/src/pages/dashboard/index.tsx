import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGetDashboard } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, FileText, Plus, AlertCircle, Clock, BookOpen, MessageSquare, ClipboardList, BookOpenCheck, CalendarClock, ArrowRight, Sparkles } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from "date-fns";

// ---------- Radial Case Strength Gauge ----------
function RadialGauge({ percent }: { percent: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? "#D4A843" : percent >= 40 ? "hsl(239 84% 67%)" : "hsl(239 84% 67%)";
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  const animOffset = circ - (animated / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
      <svg width={128} height={128} viewBox="0 0 128 128" className="-rotate-90">
        <circle cx={64} cy={64} r={r} fill="none" stroke="hsl(228 40% 12%)" strokeWidth={10} />
        <circle
          cx={64}
          cy={64}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={animOffset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-2xl leading-none" style={{ color }}>{percent}%</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Ready</span>
      </div>
    </div>
  );
}

// ---------- Countdown Timer ----------
function DeadlineCountdown({ task }: { task?: { title: string; dueDate?: string | null } }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!task || !task.dueDate) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">No deadlines set</p>
        <p className="font-mono text-xs text-muted-foreground">Add tasks with due dates</p>
      </div>
    );
  }

  const due = new Date(task.dueDate);
  const overdue = isPast(due);
  const days = Math.abs(differenceInDays(due, now));
  const hours = Math.abs(differenceInHours(due, now)) % 24;
  const mins = Math.abs(differenceInMinutes(due, now)) % 60;
  const urgent = days < 3;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-foreground line-clamp-2">{task.title}</p>
      <div className={`flex items-end gap-1 font-mono font-bold tracking-tighter ${overdue ? "text-destructive" : urgent ? "text-[#D4A843]" : "text-primary"}`}>
        <span className="text-4xl leading-none">{String(days).padStart(2, "0")}</span>
        <span className="text-base pb-1">d</span>
        <span className="text-2xl leading-none">{String(hours).padStart(2, "0")}</span>
        <span className="text-sm pb-0.5">h</span>
        <span className="text-xl leading-none">{String(mins).padStart(2, "0")}</span>
        <span className="text-xs pb-0.5">m</span>
      </div>
      <div className={`text-[10px] font-mono uppercase tracking-widest ${overdue ? "text-destructive font-bold" : "text-muted-foreground"}`}>
        {overdue ? "OVERDUE" : "remaining"} · Due {format(due, "MMM dd, yyyy")}
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboard();

  const readinessPct = data?.totalCases
    ? Math.min(100, Math.round((data.activeCases / data.totalCases) * 100))
    : 0;

  const nextDeadlineTask = data?.upcomingTasks?.find((t) => t.dueDate) ?? data?.upcomingTasks?.[0];

  return (
    <AppLayout title="Command Center">
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">

        {/* Pro Se Navigator OS Hero — intentionally visible checkpoint */}
        <Card className="relative overflow-hidden border-primary/30 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] text-white shadow-2xl shadow-primary/10">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#D4A843]/20 blur-3xl" />
          <CardContent className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    <Sparkles className="mr-2 h-3.5 w-3.5" /> Navigator OS v1B
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#D4A843]/40 bg-[#D4A843]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4A843]">
                    Procedural intelligence layer
                  </span>
                </div>
                <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                  Litigation command center for pro se operators.
                </h1>
                <p className="mt-4 text-sm md:text-base leading-7 text-slate-300 max-w-2xl">
                  The app is being upgraded from a document helper into a full litigation operating system: administrative process,
                  docket/deadline intelligence, verified case-law workflows, procedural risk checks, and settlement-readiness structure.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="text-2xl font-mono font-bold text-[#D4A843]">03</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">new visible modules</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="text-2xl font-mono font-bold text-primary">08</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">legal playbooks</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur col-span-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Current build focus</div>
                  <div className="mt-1 font-serif text-lg text-white">Foundation → premium UI → agentic workflows</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold font-serif tracking-tight">New Litigation OS Modules</h3>
              <p className="text-sm text-muted-foreground mt-1">Visible checkpoint: these modules are now part of the product surface.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Administrative Process", description: "Three-letter notice, cure, and escalation record builder.", icon: ClipboardList, href: data?.recentCases?.[0]?.id ? `/cases/${data.recentCases[0].id}/administrative` : "/cases/new" },
              { title: "Docket & Deadlines", description: "Opposing response windows, default-readiness, PACER/RECAP import roadmap.", icon: CalendarClock, href: data?.recentCases?.[0]?.id ? `/cases/${data.recentCases[0].id}/deadlines` : "/cases/new" },
              { title: "Case Law Bank", description: "Citation verification guardrails so fake case law never enters a filing draft.", icon: BookOpenCheck, href: data?.recentCases?.[0]?.id ? `/cases/${data.recentCases[0].id}/case-law` : "/cases/new" },
            ].map((module) => {
              const Icon = module.icon;
              return (
                <Link key={module.title} href={module.href}>
                  <Card className="group h-full cursor-pointer border-primary/20 bg-card/80 hover:border-primary/60 hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="rounded-xl bg-primary/10 p-3 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="mt-5 font-serif font-bold text-lg">{module.title}</div>
                      <p className="mt-2 text-sm text-muted-foreground leading-6">{module.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Top Section: Readiness Gauge + Next Deadline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Filing Readiness — radial gauge */}
          <Card className="lg:col-span-2 bg-card overflow-hidden relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-serif font-bold">Filing Readiness</CardTitle>
              <CardDescription>Active case portfolio strength</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="flex items-center gap-8">
                  <RadialGauge percent={readinessPct} />
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Active Portfolio</p>
                      <p className="font-mono text-lg font-bold">{data?.activeCases ?? 0} <span className="text-muted-foreground font-normal text-sm">active</span> / {data?.totalCases ?? 0} <span className="text-muted-foreground font-normal text-sm">total</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Evidence Gathered</p>
                      <p className="font-mono text-lg font-bold">{data?.totalEvidence ?? 0} <span className="text-muted-foreground font-normal text-sm">items</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Open Deadlines</p>
                      <p className="font-mono text-lg font-bold">{data?.upcomingDeadlines ?? 0} <span className="text-muted-foreground font-normal text-sm">pending</span></p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Deadline — live countdown */}
          <Card className="relative overflow-hidden border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Calendar className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#D4A843]" />
                Next Deadline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <DeadlineCountdown task={nextDeadlineTask} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mission Control Bento */}
        <div>
          <h3 className="text-xl font-bold font-serif tracking-tight mb-4">Mission Control</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/cases/new">
              <Card className="hover:border-primary transition-all hover:-translate-y-0.5 cursor-pointer h-full border-dashed bg-accent/30 group">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full gap-3">
                  <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="font-bold font-serif text-lg">New Case</div>
                  <div className="text-xs text-muted-foreground">Start a new legal action</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/research">
              <Card className="hover:border-primary transition-all hover:-translate-y-0.5 cursor-pointer h-full group">
                <CardContent className="flex flex-col items-start p-6 h-full justify-between gap-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-bold font-serif text-lg">Legal Research</div>
                    <div className="text-xs text-muted-foreground mt-1">Search case law and statutes</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/assistant">
              <Card className="hover:border-primary transition-all hover:-translate-y-0.5 cursor-pointer h-full group">
                <CardContent className="flex flex-col items-start p-6 h-full justify-between gap-4">
                  <MessageSquare className="h-6 w-6 text-[#D4A843]" />
                  <div>
                    <div className="font-bold font-serif text-lg">AI Assistant</div>
                    <div className="text-xs text-muted-foreground mt-1">Get strategic legal guidance</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="h-full">
              <CardContent className="flex flex-col items-start p-6 h-full justify-between gap-4">
                <FileText className="h-6 w-6 text-emerald-500" />
                <div>
                  <div className="font-bold font-serif text-lg">Total Evidence</div>
                  <div className="text-2xl font-mono mt-1">{data?.totalEvidence ?? 0}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Operations + Pending Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Recent Cases */}
          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-xl font-bold font-serif tracking-tight">Active Operations</h3>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center border border-destructive/20">
                <AlertCircle className="h-5 w-5 mr-3" />
                Failed to load cases.
              </div>
            ) : data?.recentCases?.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Briefcase className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground">No operations active</h3>
                  <p className="text-sm text-muted-foreground mb-6">Initialize your first case to begin.</p>
                  <Button asChild>
                    <Link href="/cases/new">Initialize Case</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {data?.recentCases.map((c) => (
                  <Card key={c.id} className="hover:border-primary/50 transition-colors group">
                    <CardHeader className="pb-3 border-b border-border/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-serif">
                            <Link href={`/cases/${c.id}`} className="hover:text-primary transition-colors">{c.title}</Link>
                          </CardTitle>
                          <CardDescription className="capitalize mt-1 font-mono text-xs">
                            <span className="text-primary">{c.status}</span> · {c.caseType}
                          </CardDescription>
                        </div>
                        <div className="text-right text-xs font-mono text-muted-foreground space-y-1">
                          {c.caseNumber && <div>#{c.caseNumber}</div>}
                          <div>{c.court ?? "Court TBA"}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-3 divide-x divide-border/50">
                        <div className="p-4 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Evidence</span>
                          <span className="font-mono text-sm">{c.evidenceCount} items</span>
                        </div>
                        <div className="p-4 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Tasks</span>
                          <span className="font-mono text-sm">{c.completedTaskCount} / {c.taskCount}</span>
                        </div>
                        <div className="p-4 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Target</span>
                          <span className="font-mono text-sm truncate">{c.opposingParty ?? "TBA"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-accent/30 py-2.5 px-4 flex justify-between border-t border-border/50">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        Updated: {format(new Date(c.updatedAt), "MMM dd, yyyy")}
                      </span>
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-bold uppercase tracking-wider hover:bg-primary/20 hover:text-primary group-hover:text-primary">
                        <Link href={`/cases/${c.id}`}>Open</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pending Actions */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-serif tracking-tight">Pending Actions</h3>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !data?.upcomingTasks?.length ? (
              <Card className="bg-transparent border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <CheckSquareIcon className="h-8 w-8 mb-3 opacity-50" />
                  <p className="text-sm font-medium">All clear.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="divide-y divide-border/50">
                  {data.upcomingTasks.map((task) => {
                    const isOverdue = !!task.dueDate && new Date(task.dueDate) < new Date();
                    return (
                      <div key={task.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isOverdue ? "bg-destructive" : "bg-primary animate-pulse"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm line-clamp-2">{task.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-bold" : ""}`}>
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(task.dueDate), "MMM dd")}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded border bg-background">{task.phase}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="icon" asChild className="shrink-0 h-8 w-8">
                            <Link href={`/cases/${task.caseId}/tasks`}>→</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <Card className="bg-sidebar border-sidebar-border mt-6">
              <CardContent className="p-6 text-center text-sidebar-foreground">
                <p className="font-serif italic opacity-80 text-sm">"Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat."</p>
                <p className="text-[10px] font-mono uppercase tracking-widest mt-4 opacity-50 text-primary">Stay Focused</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CheckSquareIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
