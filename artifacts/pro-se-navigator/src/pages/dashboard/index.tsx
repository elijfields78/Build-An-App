import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGetDashboard } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Calendar, FileText, Plus, AlertCircle, Clock, BookOpen,
  MessageSquare, ClipboardList, BookOpenCheck, CalendarClock, ArrowRight,
  Sparkles, Search, Zap, X, Scale, Hammer, FileStack, Gavel,
} from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { CommandPalette } from "@/components/layout/CommandPalette";

// ---------- Radial Case Strength Gauge ----------
function RadialGauge({ percent }: { percent: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const color = percent >= 80 ? "#D4A843" : "hsl(239 84% 67%)";
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
          cx={64} cy={64} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={animOffset}
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

// ---------- Empty State ----------
function DashboardEmptyState() {
  const steps = [
    {
      num: "01",
      icon: Hammer,
      title: "Build your case",
      desc: "Tell your story, upload evidence, and analyze your legal standing — all in one place.",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      num: "02",
      icon: Scale,
      title: "Understand your rights",
      desc: "Run a jurisdiction analysis, check procedural risk, and research relevant case law.",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      num: "03",
      icon: FileStack,
      title: "Draft your documents",
      desc: "Generate a verified complaint, build filing packets, and track every deadline.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <Card className="relative overflow-hidden border-primary/30 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] text-white shadow-2xl shadow-primary/10">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#D4A843]/20 blur-3xl" />
        <CardContent className="relative z-10 p-8 md:p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Welcome to Pro Se Navigator
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
            Your AI-powered litigation command center
          </h1>
          <p className="mt-4 text-sm md:text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto">
            Represent yourself with confidence. Build your story, understand your rights, draft documents, and track every deadline — without a lawyer.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="text-base px-8 font-bold shadow-lg shadow-primary/30">
              <Link href="/cases/new">
                <Plus className="mr-2 h-5 w-5" />
                Start Your First Case
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base border-white/20 text-white hover:bg-white/10">
              <Link href="/research">
                <BookOpen className="mr-2 h-5 w-5" />
                Research First
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3-step explainer */}
      <div>
        <h3 className="text-xl font-bold font-serif tracking-tight mb-1 text-center">How it works</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">Three phases from dispute to resolution</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.num} className={`border ${step.border} ${step.bg} backdrop-blur`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`font-mono text-3xl font-bold ${step.color} opacity-40 leading-none`}>{step.num}</span>
                    <div className={`rounded-xl p-2 ${step.bg} border ${step.border}`}>
                      <Icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                  </div>
                  <h4 className="font-serif font-bold text-lg mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick-start shortcuts */}
      <div>
        <h3 className="text-xl font-bold font-serif tracking-tight mb-4">Quick start</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Create a case", href: "/cases/new", icon: Plus, desc: "Start here" },
            { label: "Legal Research", href: "/research", icon: BookOpen, desc: "Search law" },
            { label: "AI Assistant", href: "/assistant", icon: MessageSquare, desc: "Get guidance" },
            { label: "View Pricing", href: "/pricing", icon: Zap, desc: "Upgrade plan" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="group cursor-pointer hover:border-primary/50 hover:-translate-y-0.5 transition-all h-full">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="rounded-lg bg-primary/10 w-fit p-2 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Onboarding Banner ----------
function OnboardingBanner({ caseId, caseTitle, evidenceCount, completedTaskCount }: {
  caseId: number;
  caseTitle: string;
  evidenceCount: number;
  completedTaskCount: number;
}) {
  const DISMISS_KEY = "pro-se-onboarding-banner-v1-dismissed";
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "true"; } catch { return false; }
  });

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "true"); } catch { /* ignore */ }
  };

  if (dismissed) return null;

  let suggestion: { label: string; href: string; sub: string };
  if (evidenceCount === 0) {
    suggestion = {
      label: "Upload your first piece of evidence",
      href: `/cases/${caseId}/evidence`,
      sub: "Evidence strengthens every claim you make",
    };
  } else if (completedTaskCount === 0) {
    suggestion = {
      label: "Work through your filing roadmap",
      href: `/cases/${caseId}/tasks`,
      sub: "20 guided tasks take you from filing to trial",
    };
  } else {
    suggestion = {
      label: "Build your case story",
      href: `/cases/${caseId}/story`,
      sub: "Your story is the foundation of your complaint",
    };
  }

  return (
    <div className="relative rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      <div className="relative z-10 rounded-full bg-primary/15 p-2 shrink-0 mt-0.5">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="relative z-10 flex-1 min-w-0">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">
          Next step for "{caseTitle}"
        </p>
        <p className="text-sm font-semibold text-foreground">{suggestion.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{suggestion.sub}</p>
        <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1.5 text-primary font-bold text-xs">
          <Link href={suggestion.href}>
            Go now <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <button
        onClick={dismiss}
        className="relative z-10 shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------- Dashboard ----------
export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboard();
  const [commandOpen, setCommandOpen] = useState(false);

  const readinessPct = data?.totalCases
    ? Math.min(100, Math.round((data.activeCases / data.totalCases) * 100))
    : 0;

  const nextDeadlineTask = data?.upcomingTasks?.find((t) => t.dueDate) ?? data?.upcomingTasks?.[0];
  const activityFeed = [
    ...(data?.recentCases?.slice(0, 4).map((c) => ({
      id: `case-${c.id}`,
      label: c.title,
      meta: `${c.caseType} · ${c.status}`,
      href: `/cases/${c.id}`,
      date: c.updatedAt,
      tone: "case",
    })) ?? []),
    ...(data?.upcomingTasks?.slice(0, 4).map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      meta: task.phase,
      href: `/cases/${task.caseId}/tasks`,
      date: task.dueDate ?? new Date().toISOString(),
      tone: "deadline",
    })) ?? []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  // Empty state
  const isEmpty = !isLoading && !error && (data?.totalCases ?? 0) === 0;

  // Onboarding banner: show for users with exactly 1 case
  const showBanner = !isLoading && !error && (data?.totalCases ?? 0) === 1 && !!data?.recentCases?.[0];
  const bannerCase = data?.recentCases?.[0];

  if (isLoading) {
    return (
      <AppLayout title="Command Center">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isEmpty) {
    return (
      <AppLayout title="Command Center">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <DashboardEmptyState />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Command Center">
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">

        {/* Onboarding banner — 1 case, guiding next step */}
        {showBanner && bannerCase && (
          <OnboardingBanner
            caseId={bannerCase.id}
            caseTitle={bannerCase.title}
            evidenceCount={bannerCase.evidenceCount}
            completedTaskCount={bannerCase.completedTaskCount}
          />
        )}

        {/* Clean hero: next deadline + next action */}
        <Card className="relative overflow-hidden border-primary/30 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] text-white shadow-2xl shadow-primary/10">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#D4A843]/20 blur-3xl" />
          <CardContent className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                  {data?.totalCases ? "Your litigation command center" : "Build your case with confidence"}
                </h1>
                <p className="mt-3 text-sm md:text-base leading-7 text-slate-300">
                  {data?.totalCases
                    ? "Track deadlines, organize evidence, draft filings, and stay ahead of procedural risks — all in one workspace."
                    : "Organize your facts, evidence, and deadlines. Draft documents. Track procedural risks. All in one place."}
                </p>
                {!data?.totalCases && (
                  <Button asChild size="lg" className="mt-5 text-base px-8 font-bold shadow-lg shadow-primary/30">
                    <Link href="/cases/new"><Plus className="mr-2 h-5 w-5" />Start Your First Case</Link>
                  </Button>
                )}
              </div>
              {nextDeadlineTask && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur min-w-[260px]">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Next deadline</div>
                  <DeadlineCountdown task={nextDeadlineTask} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ⌘K Command trigger */}
        <Card className="border-border/60 bg-card/70 backdrop-blur cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setCommandOpen(true)}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Search className="h-5 w-5" /></div>
              <div>
                <div className="font-serif text-base font-bold">Search or jump to anything</div>
                <div className="text-xs text-muted-foreground">Cases, modules, research, deadlines</div>
              </div>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </CardContent>
        </Card>

        {/* Top Section: Readiness Gauge + Next Deadline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card overflow-hidden relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-serif font-bold">Filing Readiness</CardTitle>
              <CardDescription>Active case portfolio strength</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

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
              <DeadlineCountdown task={nextDeadlineTask} />
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

          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-xl font-bold font-serif tracking-tight">Active Operations</h3>
            {error ? (
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
            {!data?.upcomingTasks?.length ? (
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
                            <Link href={`/cases/${task.caseId}/tasks`}>
                              <p className="text-sm font-medium hover:text-primary transition-colors line-clamp-2">{task.title}</p>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">{task.phase}</span>
                              {task.dueDate && (
                                <span className={`text-[10px] font-mono ${isOverdue ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                                  · {isOverdue ? "OVERDUE" : format(new Date(task.dueDate), "MMM dd")}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link href={`/cases/${task.caseId}/tasks`} className="shrink-0 mt-0.5">
                            <Zap className="h-3.5 w-3.5 text-muted-foreground opacity-0 hover:opacity-100 transition-opacity" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        {activityFeed.length > 0 && (
          <div>
            <h3 className="text-xl font-bold font-serif tracking-tight mb-4">Recent Activity</h3>
            <Card className="overflow-hidden">
              <div className="divide-y divide-border/50">
                {activityFeed.map((item) => (
                  <Link key={item.id} href={item.href}>
                    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.tone === "deadline" ? "bg-[#D4A843]" : "bg-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">{item.meta}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {format(new Date(item.date), "MMM dd")}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} cases={data?.recentCases ?? []} />
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
