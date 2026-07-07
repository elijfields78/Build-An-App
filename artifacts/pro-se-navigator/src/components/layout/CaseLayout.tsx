import React from "react";
import { Link, useLocation } from "wouter";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "./AppLayout";
import { caseModuleGroups, caseModules, caseModuleHref } from "@/lib/caseModules";
import { ChevronRight } from "lucide-react";

export function CaseLayout({ children, caseId, title }: { children: React.ReactNode; caseId: string; title: string }) {
  const [location] = useLocation();
  const id = parseInt(caseId);
  const { data: currentCase, isLoading } = useGetCase(id, { query: { enabled: !isNaN(id), queryKey: getGetCaseQueryKey(id) } });

  const activeModule = caseModules.find((module) => location === caseModuleHref(caseId, module.slug));

  return (
    <AppLayout title={isLoading ? "Loading Case..." : currentCase?.title || "Case Details"}>
      <div className="flex flex-col min-h-full">
        <div className="bg-card/95 border-b border-border sticky top-0 z-10 shadow-sm backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  <span>Case workspace</span>
                  {activeModule && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-primary">{activeModule.group}</span>
                    </>
                  )}
                </div>
                <div className="text-sm font-medium truncate mt-1">{currentCase?.title || "Case Details"}</div>
              </div>
              {activeModule && (
                <div className="hidden md:flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                  <activeModule.icon className="h-3.5 w-3.5" />
                  {activeModule.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
              {caseModuleGroups.map((group) => {
                const modules = caseModules.filter((module) => module.group === group);
                const groupActive = modules.some((module) => location === caseModuleHref(caseId, module.slug));
                return (
                  <div key={group} className={`rounded-xl border p-2 ${groupActive ? "border-primary/30 bg-primary/5" : "border-border/50 bg-background/30"}`}>
                    <div className="px-2 pb-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-bold">{group}</div>
                    <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-none">
                      {modules.map((module) => {
                        const Icon = module.icon;
                        const href = caseModuleHref(caseId, module.slug);
                        const isActive = location === href;
                        return (
                          <Link
                            key={module.slug || "overview"}
                            href={href}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-md whitespace-nowrap transition-all shrink-0 ${
                              isActive
                                ? "text-primary bg-primary/10 border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {module.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
