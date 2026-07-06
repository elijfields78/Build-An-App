import React from "react";
import { Link } from "wouter";
import { useGetDashboard } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, FileText, Plus, AlertCircle, Clock, Scale, Mail, ShieldAlert, BookOpen, MessageSquare, Target } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboard();

  return (
    <AppLayout title="Command Center">
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Top Section: Readiness & Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Target className="w-32 h-32" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-serif font-bold">Filing Readiness</CardTitle>
              <CardDescription>Overall progress across active cases</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-16 w-full" /> : (
                <div className="flex items-center gap-6">
                  <div className="text-5xl font-mono font-bold text-primary tracking-tighter">
                    {data?.totalCases ? Math.round((data.activeCases / data.totalCases) * 100) : 0}%
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Portfolio</p>
                    <p className="text-base text-foreground font-mono">{data?.activeCases || 0} active / {data?.totalCases || 0} total cases</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-destructive/10 border-destructive/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Calendar className="w-24 h-24 text-destructive" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-serif font-bold text-destructive">Next Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-16 w-32" /> : (
                <div className="flex flex-col">
                  <div className="text-4xl font-mono font-bold text-destructive tracking-tighter">
                    {data?.upcomingDeadlines || 0}
                  </div>
                  <p className="text-sm font-medium text-destructive/80 mt-1 uppercase tracking-wider">Pending items</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bento Grid Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center justify-between mb-2 mt-4">
            <h3 className="text-xl font-bold font-serif tracking-tight">Mission Control</h3>
          </div>

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
                  <div className="text-xs text-muted-foreground mt-1">Search case law & statutes</div>
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
                  <div className="text-xs text-muted-foreground mt-1">Get strategic guidance</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full">
            <CardContent className="flex flex-col items-start p-6 h-full justify-between gap-4">
              <FileText className="h-6 w-6 text-emerald-500" />
              <div>
                <div className="font-bold font-serif text-lg">Total Evidence</div>
                <div className="text-2xl font-mono mt-1">{data?.totalEvidence || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Cases Strip */}
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
                            <span className="text-primary">{c.status}</span> • {c.caseType}
                          </CardDescription>
                        </div>
                        <div className="text-right text-xs font-mono text-muted-foreground space-y-1">
                          {c.caseNumber && <div>#{c.caseNumber}</div>}
                          <div>{c.court || 'Court TBA'}</div>
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
                          <span className="font-mono text-sm truncate">{c.opposingParty || 'TBA'}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-accent/30 py-2.5 px-4 flex justify-between border-t border-border/50">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        Last Update: {format(new Date(c.updatedAt), 'MMM dd, yyyy')}
                      </span>
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-bold uppercase tracking-wider hover:bg-primary/20 hover:text-primary group-hover:text-primary">
                        <Link href={`/cases/${c.id}`}>Open →</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Upcoming Tasks */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-serif tracking-tight">Pending Actions</h3>
            
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.upcomingTasks?.length === 0 ? (
              <Card className="bg-transparent border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <CheckSquareIcon className="h-8 w-8 mb-3 opacity-50" />
                  <p className="text-sm font-medium">All clear.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="divide-y divide-border/50">
                  {data?.upcomingTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                    return (
                      <div key={task.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-destructive' : 'bg-primary animate-pulse'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm line-clamp-2">{task.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-bold' : ''}`}>
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(task.dueDate), 'MMM dd')}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded border bg-background">
                                {task.phase}
                              </span>
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
            
            {/* Intel Quote */}
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