import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { TaskCard } from "@/components/task-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Completed() {
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Task completion status updated successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
      });
    },
  });

  const completedTasks = tasks.filter(t => t.completed).sort((a, b) => {
    if (!a.completedAt || !b.completedAt) return 0;
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-mobile-md md:space-y-6 w-full max-w-full overflow-x-hidden pb-20 md:pb-6" data-testid="page-completed">
      <div>
        <h1 className="text-mobile-2xl md:text-3xl font-bold text-foreground">Completed Tasks</h1>
        <p className="text-muted-foreground mt-1 text-mobile-sm md:text-base">Review your accomplishments</p>
      </div>

      {completedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-green-500 dark:text-green-400 stroke-[1.5]" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">No completed tasks yet</h3>
          <p className="text-muted-foreground text-center max-w-md text-mobile-sm md:text-base">
            Complete some tasks to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-mobile-md md:space-y-3">
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={(taskId, completed) =>
                toggleCompleteMutation.mutate({ taskId, completed })
              }
              onDelete={(taskId) => deleteMutation.mutate(taskId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
