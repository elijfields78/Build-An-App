import React from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useListTasks, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
      <Skeleton className="h-[400px] w-full" />
    </CaseLayout>
  );

  return (
    <CaseLayout caseId={params.id} title="Filing Roadmap">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-6">
            <h3 className="font-serif font-bold text-lg mb-2">Procedural Discipline</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              Litigation is a highly structured process. Follow the steps in order. Missing a step like "Service of Process" can result in immediate dismissal regardless of the merits of your case.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {phases.map(phase => {
            const phaseTasks = tasks?.filter(t => t.phase === phase) || [];
            if (phaseTasks.length === 0) return null;
            
            const completedCount = phaseTasks.filter(t => t.completed).length;
            const isPhaseComplete = completedCount === phaseTasks.length;

            return (
              <div key={phase} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 
                    ${isPhaseComplete ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {completedCount === phaseTasks.length ? '✓' : ''}
                  </div>
                  <h3 className="text-xl font-serif font-bold capitalize text-slate-800">{phase.replace('-', ' ')}</h3>
                  <div className="flex-1 h-px bg-slate-200 ml-4" />
                </div>
                
                <Card className={`ml-4 pl-4 border-l-2 rounded-l-none border-t-0 border-r-0 border-b-0 shadow-none
                  ${isPhaseComplete ? 'border-l-green-500' : 'border-l-slate-200'}`}>
                  <CardContent className="p-0 space-y-1">
                    {phaseTasks.sort((a,b) => a.sortOrder - b.sortOrder).map(task => (
                      <div key={task.id} className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-md transition-colors">
                        <Checkbox 
                          id={`task-${task.id}`} 
                          checked={task.completed}
                          onCheckedChange={() => handleToggle(task.id, task.completed)}
                          className="mt-1 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label 
                            htmlFor={`task-${task.id}`}
                            className={`text-sm font-medium leading-none cursor-pointer ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                          >
                            {task.title}
                          </label>
                          {task.description && (
                            <p className={`text-sm ${task.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
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
