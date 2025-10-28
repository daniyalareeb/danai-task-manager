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
    <div className="space-y-6 page-transition" data-testid="page-dashboard">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Today's Focus
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Your AI-powered task dashboard</p>
        </div>
        <Link href="/tasks/new">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
            data-testid="button-new-task"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Task
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-active-count">{activeTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {urgentTasks.length} urgent
            </p>
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 mt-3">
              <div 
                className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: activeTasks.length > 0 ? `${Math.min((urgentTasks.length / activeTasks.length) * 100, 100)}%` : '0%' }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-900 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-scheduled-count">{scheduledToday.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              tasks on your calendar
            </p>
            <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2 mt-3">
              <div 
                className="bg-purple-500 dark:bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((scheduledToday.length / Math.max(activeTasks.length, 1)) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Time</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-estimated-hours">{totalEstimatedHours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              total work remaining
            </p>
            <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-2 mt-3">
              <div 
                className="bg-green-500 dark:bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalEstimatedHours / 40) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {focusTask ? (
        <Card className="border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Zap className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Your Priority Task</CardTitle>
                <p className="text-sm text-muted-foreground">Focus on this now</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
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
                <Button variant="outline" className="border-primary/20 hover:bg-primary/5" data-testid="button-schedule-tasks">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Schedule with AI
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 bg-gradient-to-br from-muted/30 to-background">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
              <Zap className="h-16 w-16 text-primary relative" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Create your first task and let AI help you prioritize and schedule your work effectively.
            </p>
            <Link href="/tasks/new">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" data-testid="button-create-first-task">
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
