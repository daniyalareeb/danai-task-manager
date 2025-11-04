import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { TaskCard } from "@/components/task-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Scheduled() {
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

  const archiveMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}/archive`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task archived",
        description: "Task has been archived successfully.",
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

  const scheduledTasks = tasks.filter(t => t.scheduledStart && !t.completed);

  // Group tasks by date
  const tasksByDate = scheduledTasks.reduce((acc, task) => {
    if (!task.scheduledStart) return acc;
    const dateKey = format(new Date(task.scheduledStart), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort dates
  const sortedDates = Object.keys(tasksByDate).sort();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-mobile-md md:space-y-6 w-full max-w-full overflow-x-hidden pb-20 md:pb-6" data-testid="page-scheduled">
      <div>
        <h1 className="text-mobile-2xl md:text-3xl font-bold text-foreground">Scheduled Tasks</h1>
        <p className="text-muted-foreground mt-1 text-mobile-sm md:text-base">View your AI-generated schedule</p>
      </div>

      {scheduledTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-2xl"></div>
            <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
              <Calendar className="h-12 w-12 md:h-16 md:w-16 text-primary stroke-[1.5]" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">No scheduled tasks</h3>
          <p className="text-muted-foreground text-center max-w-md text-mobile-sm md:text-base">
            Use the AI Scheduler to create an optimized schedule for your tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-mobile-lg md:space-y-8">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey);
            const tasksForDate = tasksByDate[dateKey].sort((a, b) => {
              if (!a.scheduledStart || !b.scheduledStart) return 0;
              return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
            });

            return (
              <div key={dateKey}>
                <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                  {format(date, "EEEE, MMMM d, yyyy")}
                </h2>
                <div className="space-y-mobile-md md:space-y-3">
                  {tasksForDate.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={(taskId, completed) =>
                        toggleCompleteMutation.mutate({ taskId, completed })
                      }
                      onDelete={(taskId) => deleteMutation.mutate(taskId)}
                      onArchive={(taskId) => archiveMutation.mutate(taskId)}
                      showAiInsights={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
