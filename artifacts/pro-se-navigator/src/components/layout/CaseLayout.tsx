import React from "react";
import { Link, useLocation } from "wouter";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "./AppLayout";
import {
  FileText, Briefcase, Info, FileSearch, ShieldAlert, Scale, CheckSquare,
  UploadCloud, Mail, BookOpenCheck, CalendarClock, ClipboardList, BrainCircuit,
  Handshake, Gavel, LibraryBig, CalendarDays, FileStack, Search, Swords,
  UserCheck, ChevronLeft,
} from "lucide-react";

interface TabDef {
  name: string;
  suffix: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { name: "Overview",    suffix: "",                icon: Info            },
  { name: "Story",       suffix: "/story",          icon: FileText        },
  { name: "Evidence",    suffix: "/evidence",       icon: UploadCloud     },
  { name: "Timeline",    suffix: "/timeline",       icon: CalendarDays    },
  { name: "Jurisdiction",suffix: "/jurisdiction",   icon: Scale           },
  { name: "Risk",        suffix: "/procedural-risk",icon: ShieldAlert     },
  { name: "IFP",         suffix: "/ifp",            icon: Briefcase       },
  { name: "Complaint",   suffix: "/complaint",      icon: FileSearch      },
  { name: "Draft Review",suffix: "/draft-review",   icon: Gavel           },
  { name: "Letters",     suffix: "/dispute-letter", icon: Mail            },
  { name: "Packets",     suffix: "/documents",      icon: FileStack       },
  { name: "Deadlines",   suffix: "/deadlines",      icon: CalendarClock   },
  { name: "Discovery",   suffix: "/discovery",      icon: Search          },
  { name: "Motions",     suffix: "/motions",        icon: Swords          },
  { name: "Service",     suffix: "/service",        icon: UserCheck       },
  { name: "Tasks",       suffix: "/tasks",          icon: CheckSquare     },
  { name: "Court Docs",  suffix: "/court-documents",icon: ShieldAlert     },
  { name: "Admin Process",suffix: "/administrative",icon: ClipboardList   },
  { name: "Case Law",    suffix: "/case-law",       icon: BookOpenCheck   },
  { name: "Settlement",  suffix: "/settlement",     icon: Handshake       },
  { name: "Appeals",     suffix: "/appeals",        icon: Scale           },
  { name: "Playbooks",   suffix: "/playbooks",      icon: LibraryBig      },
  { name: "Agents",      suffix: "/agents",         icon: BrainCircuit    },
  { name: "Memory",      suffix: "/memory",         icon: BrainCircuit    },
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

  const tabsWithHref = TABS.map((t) => ({
    ...t,
    href: t.suffix === "" ? `/cases/${caseId}` : `/cases/${caseId}${t.suffix}`,
  }));

  return (
    <AppLayout title={isLoading ? "Loading Case..." : currentCase?.title || "Case Details"}>
      <div className="flex flex-col min-h-full">
        {/* Clean single-row tab bar */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
              {/* Back to dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 mr-1 border-r border-border/40 pr-3"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Cases
              </Link>

              {/* All tabs in one scrollable row */}
              {tabsWithHref.map((tab) => {
                const Icon = tab.icon;
                const isActive = location === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Clean content area */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
