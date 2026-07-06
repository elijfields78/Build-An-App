import React from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, UploadCloud, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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

  // Calculate overall readiness
  const completedSections = [data.storyComplete, data.jurisdictionComplete, data.ifpComplete].filter(Boolean).length;
  const readinessPercent = Math.round((completedSections / 3) * 100);

  return (
    <CaseLayout caseId={params.id} title={data.title}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg font-serif">Case Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</div>
                <div className="mt-1 capitalize font-medium text-foreground">{data.caseType}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</div>
                <div className="mt-1 capitalize font-medium text-primary">{data.status}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Court</div>
                <div className="mt-1 font-medium text-foreground">{data.court || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Case Number</div>
                <div className="mt-1 font-mono text-foreground">{data.caseNumber || 'TBD'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Opposing Party</div>
                <div className="mt-1 font-medium text-foreground">{data.opposingParty || 'Not specified'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</div>
                <div className="mt-2 text-foreground/80 leading-relaxed text-sm">{data.summary || 'No summary added.'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Evidence */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-serif">Recent Evidence</CardTitle>
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              {data.recentEvidence?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <p>No evidence uploaded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {data.recentEvidence?.map((ev) => (
                    <div key={ev.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium text-foreground text-sm">{ev.fileName}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                          {format(new Date(ev.uploadedAt), 'MMM dd, yyyy')} • {(ev.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <CheckCircle2 className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
                Filing Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-mono font-bold text-foreground tracking-tighter">{readinessPercent}%</span>
              </div>
              <Progress value={readinessPercent} className="h-1.5 mb-5 bg-primary/20 [&>div]:bg-primary" />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${data.storyComplete ? 'text-primary' : 'text-muted-foreground/30'}`} />
                  <span className={data.storyComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}>Story Builder</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${data.jurisdictionComplete ? 'text-primary' : 'text-muted-foreground/30'}`} />
                  <span className={data.jurisdictionComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}>Jurisdiction Analyzer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${data.ifpComplete ? 'text-primary' : 'text-muted-foreground/30'}`} />
                  <span className={data.ifpComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}>Fee Waiver (IFP)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Next Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {data.tasks?.filter(t => !t.completed).length === 0 ? (
                 <div className="p-6 text-center text-sm text-muted-foreground">All caught up.</div>
               ) : (
                 <div className="divide-y divide-border/50 text-sm">
                    {data.tasks?.filter(t => !t.completed).slice(0, 5).map(task => (
                      <div key={task.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <p className="font-medium text-foreground line-clamp-1">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5 uppercase font-mono tracking-wider">{task.phase}</p>
                      </div>
                    ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </CaseLayout>
  );
}