import React from "react";
import { Link, useLocation } from "wouter";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "./AppLayout";
import { FileText, Briefcase, Info, FileSearch, ShieldAlert, Scale, CheckSquare, UploadCloud } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function CaseLayout({ children, caseId, title }: { children: React.ReactNode; caseId: string; title: string }) {
  const [location] = useLocation();
  const id = parseInt(caseId);
  const { data: currentCase, isLoading } = useGetCase(id, { query: { enabled: !isNaN(id), queryKey: getGetCaseQueryKey(id) } });

  const tabs = [
    { name: "Overview", href: `/cases/${caseId}`, icon: Info },
    { name: "Story", href: `/cases/${caseId}/story`, icon: FileText },
    { name: "Evidence", href: `/cases/${caseId}/evidence`, icon: UploadCloud },
    { name: "Jurisdiction", href: `/cases/${caseId}/jurisdiction`, icon: Scale },
    { name: "IFP", href: `/cases/${caseId}/ifp`, icon: Briefcase },
    { name: "Complaint", href: `/cases/${caseId}/complaint`, icon: FileSearch },
    { name: "Court Docs", href: `/cases/${caseId}/court-documents`, icon: ShieldAlert },
    { name: "Tasks", href: `/cases/${caseId}/tasks`, icon: CheckSquare },
  ];

  return (
    <AppLayout title={isLoading ? "Loading Case..." : currentCase?.title || "Case Details"}>
      <div className="flex flex-col min-h-full">
        {/* Tab bar — scrollable, no scrollbar shown */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-900">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
