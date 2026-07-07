import React from "react";
import { Link, useLocation } from "wouter";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "./AppLayout";
import { FileText, Briefcase, Info, FileSearch, ShieldAlert, Scale, CheckSquare, UploadCloud, Mail, BookOpenCheck, CalendarClock, ClipboardList, BrainCircuit, Handshake, Gavel, LibraryBig, CalendarDays, FileStack, UserCheck } from "lucide-react";

export function CaseLayout({ children, caseId, title }: { children: React.ReactNode; caseId: string; title: string }) {
  const [location] = useLocation();
  const id = parseInt(caseId);
  const { data: currentCase, isLoading } = useGetCase(id, { query: { enabled: !isNaN(id), queryKey: getGetCaseQueryKey(id) } });

  const tabs = [
    { name: "Overview", href: `/cases/${caseId}`, icon: Info },
    { name: "Playbooks", href: `/cases/${caseId}/playbooks`, icon: LibraryBig },
    { name: "Story", href: `/cases/${caseId}/story`, icon: FileText },
    { name: "Memory", href: `/cases/${caseId}/memory`, icon: BrainCircuit },
    { name: "Timeline", href: `/cases/${caseId}/timeline`, icon: CalendarDays },
    { name: "Evidence", href: `/cases/${caseId}/evidence`, icon: UploadCloud },
    { name: "Jurisdiction", href: `/cases/${caseId}/jurisdiction`, icon: Scale },
    { name: "Risk", href: `/cases/${caseId}/procedural-risk`, icon: ShieldAlert },
    { name: "IFP", href: `/cases/${caseId}/ifp`, icon: Briefcase },
    { name: "Complaint", href: `/cases/${caseId}/complaint`, icon: FileSearch },
    { name: "Draft Review", href: `/cases/${caseId}/draft-review`, icon: Gavel },
    { name: "Packets", href: `/cases/${caseId}/documents`, icon: FileStack },
    { name: "Court Docs", href: `/cases/${caseId}/court-documents`, icon: ShieldAlert },
    { name: "Docket", href: `/cases/${caseId}/deadlines`, icon: CalendarClock },
    { name: "Service", href: `/cases/${caseId}/service`, icon: UserCheck },
    { name: "Tasks", href: `/cases/${caseId}/tasks`, icon: CheckSquare },
    { name: "Letters", href: `/cases/${caseId}/dispute-letter`, icon: Mail },
    { name: "Admin Process", href: `/cases/${caseId}/administrative`, icon: ClipboardList },
    { name: "Case Law", href: `/cases/${caseId}/case-law`, icon: BookOpenCheck },
    { name: "Settlement", href: `/cases/${caseId}/settlement`, icon: Handshake },
    { name: "Agents", href: `/cases/${caseId}/agents`, icon: BrainCircuit },
  ];

  return (
    <AppLayout title={isLoading ? "Loading Case..." : currentCase?.title || "Case Details"}>
      <div className="flex flex-col min-h-full">
        {/* Tab bar — compact, dark matching surface */}
        <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-none md:justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "text-primary border-b-2 border-primary bg-primary/5 rounded-b-none"
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