import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Plus, Zap, Clock, Target } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
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

  const activeTasks = tasks.filter(t => !t.completed);
  const focusTask = activeTasks.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    if (a.aiPriority && b.aiPriority) return a.aiPriority - b.aiPriority;
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    return 0;
  })[0];

  const urgentTasks = activeTasks.filter(t => t.priority === "urgent");
  const scheduledToday = activeTasks.filter(t => {
    if (!t.scheduledStart) return false;
    const today = new Date();
    const scheduled = new Date(t.scheduledStart);
    return scheduled.toDateString() === today.toDateString();
  });

  const totalEstimatedHours = activeTasks.reduce((sum, task) => {
    return sum + (task.estimatedDuration || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Today's Focus</h1>
          <p className="text-muted-foreground mt-1">Your AI-powered task dashboard</p>
        </div>
        <Link href="/tasks/new">
          <Button data-testid="button-new-task">
            <Plus className="h-5 w-5 mr-2" />
            New Task
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-count">{activeTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {urgentTasks.length} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-scheduled-count">{scheduledToday.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              tasks on your calendar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Time</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-estimated-hours">{totalEstimatedHours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              total work remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {focusTask ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Your Priority Task</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TaskCard
              task={focusTask}
              onToggleComplete={(taskId, completed) =>
                toggleCompleteMutation.mutate({ taskId, completed })
              }
              onDelete={(taskId) => deleteMutation.mutate(taskId)}
              showAiInsights={true}
            />
            <div className="mt-4 flex gap-3 flex-wrap">
              <Link href="/scheduler">
                <Button variant="outline" data-testid="button-schedule-tasks">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Schedule with AI
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first task and let AI help you prioritize and schedule your work effectively.
            </p>
            <Link href="/tasks/new">
              <Button data-testid="button-create-first-task">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Task
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {urgentTasks.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Other Urgent Tasks</h2>
          <div className="space-y-3">
            {urgentTasks.slice(1).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={(taskId, completed) =>
                  toggleCompleteMutation.mutate({ taskId, completed })
                }
                onDelete={(taskId) => deleteMutation.mutate(taskId)}
                showAiInsights={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListTodo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <path d="M14 4h7" />
      <path d="M14 9h7" />
      <path d="M14 15h7" />
      <path d="M14 20h7" />
    </svg>
  );
}
