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
        <Card className="bg-red-50 text-red-900 border-red-200">
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
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Case Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Role</div>
                <div className="mt-1 capitalize font-medium">{data.caseType}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Status</div>
                <div className="mt-1 capitalize font-medium">{data.status}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Court</div>
                <div className="mt-1 font-medium">{data.court || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Case Number</div>
                <div className="mt-1 font-medium">{data.caseNumber || 'TBD'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Opposing Party</div>
                <div className="mt-1 font-medium">{data.opposingParty || 'Not specified'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Notes</div>
                <div className="mt-1 text-slate-700">{data.summary || 'No summary added.'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Evidence */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Evidence</CardTitle>
              <UploadCloud className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="p-0">
              {data.recentEvidence?.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>No evidence uploaded yet.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {data.recentEvidence?.map((ev) => (
                    <div key={ev.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">{ev.fileName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(ev.uploadedAt), 'MMM d, yyyy')} • {(ev.fileSize / 1024).toFixed(1)} KB
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
          <Card className="bg-slate-50 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Filing Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{readinessPercent}%</span>
              </div>
              <Progress value={readinessPercent} className="h-2 mb-4" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${data.storyComplete ? 'text-green-500' : 'text-slate-300'}`} />
                  <span className={data.storyComplete ? 'text-slate-900' : 'text-slate-500'}>Story Builder</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${data.jurisdictionComplete ? 'text-green-500' : 'text-slate-300'}`} />
                  <span className={data.jurisdictionComplete ? 'text-slate-900' : 'text-slate-500'}>Jurisdiction Analyzer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${data.ifpComplete ? 'text-green-500' : 'text-slate-300'}`} />
                  <span className={data.ifpComplete ? 'text-slate-900' : 'text-slate-500'}>Fee Waiver (IFP)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Next Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {data.tasks?.filter(t => !t.completed).length === 0 ? (
                 <div className="p-4 text-center text-sm text-slate-500">All caught up.</div>
               ) : (
                 <div className="divide-y text-sm">
                    {data.tasks?.filter(t => !t.completed).slice(0, 5).map(task => (
                      <div key={task.id} className="p-3 hover:bg-slate-50">
                        <p className="font-medium text-slate-800 line-clamp-1">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-1 capitalize">{task.phase}</p>
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
