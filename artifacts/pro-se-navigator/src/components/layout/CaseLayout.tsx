import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "./AppLayout";
import {
  FileText, Briefcase, Info, FileSearch, ShieldAlert, Scale, CheckSquare,
  UploadCloud, Mail, BookOpenCheck, CalendarClock, ClipboardList, BrainCircuit,
  Handshake, Gavel, LibraryBig, CalendarDays, FileStack, Search, Swords,
  Hammer, ChevronDown,
} from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";

type PhaseId = "build" | "file" | "litigate" | "resolve";

interface TabDef {
  name: string;
  suffix: string;
  icon: React.ElementType;
  phase: PhaseId;
}

interface PhaseMeta {
  label: string;
  icon: React.ElementType;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  dotColor: string;
}

const PHASE_META: Record<PhaseId, PhaseMeta> = {
  build: {
    label: "Build",
    icon: Hammer,
    activeBg: "bg-indigo-500/15",
    activeBorder: "border-indigo-500/50",
    activeText: "text-indigo-300",
    dotColor: "bg-indigo-400",
  },
  file: {
    label: "File",
    icon: FileStack,
    activeBg: "bg-sky-500/15",
    activeBorder: "border-sky-500/50",
    activeText: "text-sky-300",
    dotColor: "bg-sky-400",
  },
  litigate: {
    label: "Litigate",
    icon: Gavel,
    activeBg: "bg-amber-500/15",
    activeBorder: "border-amber-500/50",
    activeText: "text-amber-300",
    dotColor: "bg-amber-400",
  },
  resolve: {
    label: "Resolve",
    icon: Handshake,
    activeBg: "bg-emerald-500/15",
    activeBorder: "border-emerald-500/50",
    activeText: "text-emerald-300",
    dotColor: "bg-emerald-400",
  },
};

const PHASE_ORDER: PhaseId[] = ["build", "file", "litigate", "resolve"];

const TABS: TabDef[] = [
  { name: "Story",         suffix: "/story",           icon: FileText,      phase: "build"    },
  { name: "Memory",        suffix: "/memory",          icon: BrainCircuit,  phase: "build"    },
  { name: "Timeline",      suffix: "/timeline",        icon: CalendarDays,  phase: "build"    },
  { name: "Evidence",      suffix: "/evidence",        icon: UploadCloud,   phase: "build"    },
  { name: "Jurisdiction",  suffix: "/jurisdiction",    icon: Scale,         phase: "build"    },
  { name: "Risk",          suffix: "/procedural-risk", icon: ShieldAlert,   phase: "build"    },
  { name: "IFP",           suffix: "/ifp",             icon: Briefcase,     phase: "file"     },
  { name: "Complaint",     suffix: "/complaint",       icon: FileSearch,    phase: "file"     },
  { name: "Draft Review",  suffix: "/draft-review",    icon: Gavel,         phase: "file"     },
  { name: "Packets",       suffix: "/documents",       icon: FileStack,     phase: "file"     },
  { name: "Letters",       suffix: "/dispute-letter",  icon: Mail,          phase: "file"     },
  { name: "Discovery",     suffix: "/discovery",       icon: Search,        phase: "litigate" },
  { name: "Motions",       suffix: "/motions",         icon: Swords,        phase: "litigate" },
  { name: "Docket",        suffix: "/deadlines",       icon: CalendarClock, phase: "litigate" },
  { name: "Tasks",         suffix: "/tasks",           icon: CheckSquare,   phase: "litigate" },
  { name: "Court Docs",    suffix: "/court-documents", icon: ShieldAlert,   phase: "litigate" },
  { name: "Admin Process", suffix: "/administrative",  icon: ClipboardList, phase: "litigate" },
  { name: "Case Law",      suffix: "/case-law",        icon: BookOpenCheck, phase: "litigate" },
  { name: "Settlement",    suffix: "/settlement",      icon: Handshake,     phase: "resolve"  },
  { name: "Playbooks",     suffix: "/playbooks",       icon: LibraryBig,    phase: "resolve"  },
  { name: "Agents",        suffix: "/agents",          icon: BrainCircuit,  phase: "resolve"  },
];

export function CaseLayout({ children, caseId, title }: {
  children: React.ReactNode;
  caseId: string;
  title: string;
}) {
  const [location] = useLocation();
  const id = parseInt(caseId);
  const { data: currentCase, isLoading } = useGetCase(id, {
    query: { enabled: !isNaN(id), queryKey: getGetCaseQueryKey(id) },
  });

  const [activePhase, setActivePhase] = usePersistentState<PhaseId>(
    `case-phase-${caseId}`,
    "build",
  );

  const overviewHref = `/cases/${caseId}`;
  const isOverview = location === overviewHref;

  const tabsWithHref = TABS.map((t) => ({ ...t, href: `/cases/${caseId}${t.suffix}` }));

  // Auto-switch to the phase that owns the current tab
  useEffect(() => {
    const matched = tabsWithHref.find((t) => location === t.href);
    if (matched && matched.phase !== activePhase) {
      setActivePhase(matched.phase);
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleTabs = tabsWithHref.filter((t) => t.phase === activePhase);
  const meta = PHASE_META[activePhase];

  return (
    <AppLayout title={isLoading ? "Loading Case..." : currentCase?.title || "Case Details"}>
      <div className="flex flex-col min-h-full">

        {/* ── Compound sticky header: phase selector + filtered tab row ── */}
        <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">

          {/* Phase selector */}
          <div className="px-3 pt-2.5 pb-0 border-b border-border/40">

            {/* Desktop: pill buttons */}
            <div className="hidden md:flex items-center gap-1">
              {/* Overview — always-visible anchor */}
              <Link
                href={overviewHref}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all shrink-0 border mb-[-1px] ${
                  isOverview
                    ? "bg-primary/15 border-primary/50 text-primary border-b-0 rounded-b-none"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Info className="h-3.5 w-3.5 shrink-0" />
                Overview
              </Link>

              <div className="h-4 w-px bg-border/60 mx-1.5 shrink-0" />

              {/* Phase pills */}
              {PHASE_ORDER.map((phaseId) => {
                const m = PHASE_META[phaseId];
                const PhaseIcon = m.icon;
                const isActive = phaseId === activePhase;
                return (
                  <button
                    key={phaseId}
                    onClick={() => setActivePhase(phaseId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-t-md transition-all shrink-0 border border-b-0 mb-[-1px] ${
                      isActive
                        ? `${m.activeBg} ${m.activeBorder} ${m.activeText}`
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    }`}
                  >
                    <PhaseIcon className="h-3.5 w-3.5 shrink-0" />
                    {m.label}
                    {isActive && (
                      <span className={`ml-0.5 inline-block w-1.5 h-1.5 rounded-full ${m.dotColor} opacity-80`} />
                    )}
                  </button>
                );
              })}

              <span className="ml-auto text-[10px] text-muted-foreground font-mono uppercase tracking-widest pr-1 hidden lg:inline-block pb-1.5">
                {visibleTabs.length} modules
              </span>
            </div>

            {/* Mobile: Overview link + phase <select> */}
            <div className="flex md:hidden items-center gap-2 pb-2">
              <Link
                href={overviewHref}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all shrink-0 border ${
                  isOverview
                    ? "bg-primary/15 border-primary/50 text-primary"
                    : "border-border/50 text-muted-foreground"
                }`}
              >
                <Info className="h-3.5 w-3.5 shrink-0" />
                Overview
              </Link>

              <div className="relative flex-1">
                <select
                  value={activePhase}
                  onChange={(e) => setActivePhase(e.target.value as PhaseId)}
                  className="w-full appearance-none bg-accent/40 border border-border rounded-md pl-3 pr-8 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                >
                  {PHASE_ORDER.map((phaseId) => (
                    <option key={phaseId} value={phaseId}>
                      {PHASE_META[phaseId].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Tab bar — shows only the active phase's tabs */}
          <div className="flex items-center gap-0.5 overflow-x-auto px-3 py-1.5 scrollbar-none">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? `${meta.activeBg} border-b-2 ${meta.activeBorder} ${meta.activeText} rounded-b-none`
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
