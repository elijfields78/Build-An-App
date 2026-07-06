import React from "react";
import { Link } from "wouter";
import { useGetDashboard } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, FileText, Plus, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboard();

  return (
    <AppLayout title="Case Command Center">
      <div className="p-6 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <Briefcase className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{data?.totalCases || 0}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{data?.activeCases || 0}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <Calendar className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-red-600">{data?.upcomingDeadlines || 0}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{data?.totalEvidence || 0}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Cases */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-serif text-slate-900">Your Cases</h3>
              <Button asChild size="sm">
                <Link href="/cases/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Link>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Failed to load cases.
              </div>
            ) : data?.recentCases?.length === 0 ? (
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                  <Briefcase className="h-10 w-10 text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900">No cases yet</h3>
                  <p className="text-slate-500 mb-4">Start your first case to get organized.</p>
                  <Button asChild>
                    <Link href="/cases/new">Start a Case</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data?.recentCases.map((c) => (
                  <Card key={c.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-serif">
                            <Link href={`/cases/${c.id}`} className="hover:underline">{c.title}</Link>
                          </CardTitle>
                          <CardDescription className="capitalize mt-1">
                            {c.caseType} • {c.status}
                          </CardDescription>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          {c.caseNumber && <div>#{c.caseNumber}</div>}
                          <div>{c.court || 'Court TBA'}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex flex-col border-r border-slate-100">
                          <span className="text-slate-500 text-xs">Evidence</span>
                          <span className="font-semibold">{c.evidenceCount} items</span>
                        </div>
                        <div className="flex flex-col border-r border-slate-100 px-2">
                          <span className="text-slate-500 text-xs">Tasks</span>
                          <span className="font-semibold">{c.completedTaskCount} / {c.taskCount} done</span>
                        </div>
                        <div className="flex flex-col px-2">
                          <span className="text-slate-500 text-xs">Opposing Party</span>
                          <span className="font-semibold truncate">{c.opposingParty || '-'}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 bg-slate-50 py-2 border-t flex justify-between">
                      <span className="text-xs text-slate-500">
                        Updated {format(new Date(c.updatedAt), 'MMM d, yyyy')}
                      </span>
                      <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold">
                        <Link href={`/cases/${c.id}`}>Open Case Center →</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-serif text-slate-900">Upcoming Tasks</h3>
            
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.upcomingTasks?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <CheckSquare className="h-8 w-8 text-slate-300 mb-2" />
                  <p>No upcoming tasks</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="divide-y">
                  {data?.upcomingTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full ${task.dueDate && new Date(task.dueDate) < new Date() ? 'bg-red-500' : 'bg-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 line-clamp-2">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 capitalize">
                              {task.phase}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild className="shrink-0">
                           <Link href={`/cases/${task.caseId}/tasks`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* Encouragement Quote */}
            <Card className="bg-primary text-primary-foreground border-none">
              <CardContent className="p-6 text-center">
                <p className="font-serif italic">"You can learn the process one step at a time. Stay factual, organized, and persistent."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CheckSquare(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
