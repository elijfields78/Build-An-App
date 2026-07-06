import React from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useListTasks, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Target } from "lucide-react";

export default function CaseTasks({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data: tasks, isLoading } = useListTasks(id, { query: { enabled: !isNaN(id), queryKey: getListTasksQueryKey(id) } });
  const updateTask = useUpdateTask();
  const qc = useQueryClient();

  const handleToggle = (taskId: number, currentCompleted: boolean) => {
    updateTask.mutate({ id, tid: taskId, data: { completed: !currentCompleted } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/cases/${id}/tasks`] });
      },
      onError: () => toast.error("Failed to update task")
    });
  };

  const phases = ["pre-filing", "filing", "service", "response", "discovery", "motions", "trial", "appeal"];

  if (isLoading) return (
    <CaseLayout caseId={params.id} title="Filing Roadmap">
      <Skeleton className="h-[500px] w-full max-w-4xl mx-auto" />
    </CaseLayout>
  );

  return (
    <CaseLayout caseId={params.id} title="Filing Roadmap">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <Card className="bg-primary/5 border-primary/20 relative overflow-hidden shadow-md shadow-black/5">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Target className="w-24 h-24 text-primary" />
          </div>
          <CardContent className="p-8 relative z-10">
            <h3 className="font-serif font-bold text-2xl mb-3 tracking-tight text-primary">Procedural Discipline</h3>
            <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
              Litigation is a highly structured process. Follow the steps in order. Missing a step like "Service of Process" can result in immediate dismissal regardless of the merits of your case.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-10 pl-2">
          {phases.map(phase => {
            const phaseTasks = tasks?.filter(t => t.phase === phase) || [];
            if (phaseTasks.length === 0) return null;
            
            const completedCount = phaseTasks.filter(t => t.completed).length;
            const isPhaseComplete = completedCount === phaseTasks.length;

            return (
              <div key={phase} className="relative">
                <div className="flex items-center gap-5 mb-5 relative">
                  {/* Vertical connector line */}
                  <div className={`absolute top-8 left-4 bottom-[-40px] w-px -ml-px
                    ${isPhaseComplete ? 'bg-primary' : 'bg-border'}`} 
                  />
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors shadow-sm
                    ${isPhaseComplete ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {completedCount === phaseTasks.length ? '✓' : ''}
                  </div>
                  <h3 className="text-2xl font-serif font-bold capitalize text-foreground tracking-tight">{phase.replace('-', ' ')}</h3>
                  <div className="flex-1 h-px bg-border/50 ml-4 hidden sm:block" />
                  <div className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider bg-background px-2 py-1 rounded border border-border/50">
                    {completedCount} / {phaseTasks.length}
                  </div>
                </div>
                
                <Card className={`ml-10 bg-card/50 backdrop-blur-sm border-border/50 shadow-sm transition-colors
                  ${isPhaseComplete ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {phaseTasks.sort((a,b) => a.sortOrder - b.sortOrder).map(task => (
                        <div key={task.id} className="flex items-start space-x-4 p-5 hover:bg-accent/30 transition-colors group">
                          <Checkbox 
                            id={`task-${task.id}`} 
                            checked={task.completed}
                            onCheckedChange={() => handleToggle(task.id, task.completed)}
                            className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="grid gap-1.5 leading-none flex-1">
                            <label 
                              htmlFor={`task-${task.id}`}
                              className={`text-base font-medium leading-relaxed cursor-pointer transition-colors ${task.completed ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}
                            >
                              {task.title}
                            </label>
                            {task.description && (
                              <p className={`text-sm leading-relaxed mt-1 transition-colors ${task.completed ? 'text-muted-foreground opacity-50 line-through' : 'text-foreground/70'}`}>
                                {task.description}
                              </p>
                            )}
                            {task.dueDate && !task.completed && (
                              <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 w-fit px-2 py-1 rounded">
                                Due: {task.dueDate}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </CaseLayout>
  );
}