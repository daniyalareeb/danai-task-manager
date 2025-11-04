import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Plus, Zap, Clock, Target, BarChart3, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}`, { completed });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
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
      <div className="space-y-mobile-md md:space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-48 md:w-64" />
          <Skeleton className="h-12 w-24 md:w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-mobile-sm md:gap-4">
          <Skeleton className="h-32 md:h-36" />
          <Skeleton className="h-32 md:h-36" />
          <Skeleton className="h-32 md:h-36" />
        </div>
        <Skeleton className="h-64 md:h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-mobile-md md:space-y-6 page-transition w-full max-w-full overflow-x-hidden pb-20 md:pb-6 bg-gradient-to-b from-background via-background to-primary/10" data-testid="page-dashboard">
      {/* Header matching mobile design */}
      <div className="flex items-center justify-between gap-mobile-sm md:gap-4">
        <div className="flex items-center gap-mobile-sm md:gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 md:h-6 md:w-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-mobile-2xl md:text-4xl font-bold text-foreground">
              Today's Focus
            </h1>
            <p className="text-mobile-xs md:text-sm text-muted-foreground">Your AI dashboard</p>
          </div>
        </div>
        <Link 
          href="/tasks/new"
          onClick={() => sessionStorage.setItem("previousLocation", "/")}
        >
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary hover:to-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-11 md:h-12 px-4 md:px-6 text-mobile-base md:text-base"
            data-testid="button-new-task"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            <span>New Task +</span>
          </Button>
        </Link>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-mobile-md md:gap-4 w-full max-w-full">
        {/* Active Card - Blue Gradient */}
        <Card className="gradient-card-blue border-0 shadow-xl hover:shadow-2xl overflow-hidden relative hover-elevate transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-mobile-md md:p-6">
            <CardTitle className="text-sm md:text-base font-semibold text-white">Active Tasks</CardTitle>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-mobile-md md:p-6 pt-0">
            <div className="text-mobile-3xl md:text-4xl font-bold text-white mb-1 tracking-tight transition-all duration-300" data-testid="text-active-count">
              {activeTasks.length}
            </div>
            <p className="text-mobile-xs md:text-xs text-white/80 mb-3">
              {urgentTasks.length} urgent
            </p>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div 
                className="bg-white h-1.5 rounded-full transition-all duration-500"
                style={{ width: activeTasks.length > 0 ? `${Math.min((urgentTasks.length / activeTasks.length) * 100, 100)}%` : '0%' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Today Card - Purple/Magenta Gradient */}
        <Card className="gradient-card-purple border-0 shadow-xl hover:shadow-2xl overflow-hidden relative hover-elevate transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-sm md:text-base font-semibold text-white">Scheduled Today</CardTitle>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-mobile-md md:p-6 pt-0">
            <div className="text-mobile-3xl md:text-4xl font-bold text-white mb-1 tracking-tight transition-all duration-300" data-testid="text-scheduled-count">
              {scheduledToday.length}
            </div>
            <p className="text-mobile-xs md:text-xs text-white/80 mb-3">
              {scheduledToday.length} tasks on your calendar
            </p>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div 
                className="bg-white h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((scheduledToday.length / Math.max(activeTasks.length, 1)) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Time Card - Green Gradient */}
        <Card className="gradient-card-green border-0 shadow-xl hover:shadow-2xl overflow-hidden relative hover-elevate transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-sm md:text-base font-semibold text-white">Estimated Time</CardTitle>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Target className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-mobile-md md:p-6 pt-0">
            <div className="text-mobile-3xl md:text-4xl font-bold text-white mb-1 tracking-tight transition-all duration-300" data-testid="text-estimated-hours">
              {totalEstimatedHours}h
            </div>
            <p className="text-mobile-xs md:text-xs text-white/80 mb-3">
              total work remaining
            </p>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div 
                className="bg-white h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalEstimatedHours / 40) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Task Card */}
      {focusTask ? (
        <Card className={`bg-card border-border/50 overflow-hidden relative hover-elevate transition-all duration-300 shadow-lg hover:shadow-xl ${
          focusTask.priority === "urgent" ? "border-l-[6px] border-l-red-600 dark:border-l-red-500" :
          focusTask.priority === "high" ? "border-l-[6px] border-l-orange-600 dark:border-l-orange-500" :
          focusTask.priority === "medium" ? "border-l-[6px] border-l-yellow-500 dark:border-l-yellow-400" :
          "border-l-[6px] border-l-green-600 dark:border-l-green-500"
        }`}>
          <CardHeader className="p-mobile-md md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary" />
              </div>
              <div>
                <CardTitle className="text-mobile-xl md:text-2xl text-foreground">Your Priority Task</CardTitle>
                <p className="text-mobile-xs md:text-sm text-muted-foreground">Focus on this now</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-mobile-md md:p-6 pt-0 space-y-mobile-md md:space-y-4">
            <div className="flex items-start gap-3 p-mobile-md md:p-4 rounded-lg bg-muted/30">
              <input
                type="checkbox"
                checked={focusTask.completed}
                onChange={(e) => toggleCompleteMutation.mutate({ taskId: focusTask.id, completed: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-2 border-border accent-primary cursor-pointer"
                data-testid={`checkbox-task-${focusTask.id}`}
              />
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-mobile-base md:text-lg text-foreground mb-1 ${focusTask.completed ? "line-through opacity-60" : ""}`}>
                  {focusTask.title}
                </h3>
                {focusTask.description && (
                  <p className="text-mobile-xs md:text-sm text-muted-foreground mb-3 leading-relaxed">
                    {focusTask.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 md:gap-3 text-mobile-xs md:text-sm">
                  {focusTask.estimatedDuration && (
                    <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-medium">
                      <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      <span>{focusTask.estimatedDuration}h</span>
                    </div>
                  )}
                  {focusTask.deadline && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="h-3 w-3 md:h-4 md:w-4" />
                      <span>{format(new Date(focusTask.deadline), "MMM d, h:mm a")}</span>
                    </div>
                  )}
                  {focusTask.scheduledStart && (
                    <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-medium">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                      <span>
                        {format(new Date(focusTask.scheduledStart), "MMM d, h:mm a")}
                        {focusTask.scheduledEnd && ` - ${format(new Date(focusTask.scheduledEnd), "h:mm a")}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/scheduler")}
              className="w-full bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary hover:to-primary/90 text-white shadow-lg hover:shadow-xl transition-all h-11 md:h-12 text-mobile-base md:text-base"
              data-testid="button-schedule-tasks"
            >
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Schedule with AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <div className="relative mb-4 md:mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-4 md:p-6 rounded-full">
                <Zap className="h-12 w-12 md:h-16 md:w-16 text-primary relative" />
              </div>
            </div>
            <h3 className="text-mobile-lg md:text-xl font-semibold mb-2 text-foreground">No tasks yet</h3>
            <p className="text-mobile-xs md:text-sm text-muted-foreground text-center mb-2 leading-relaxed max-w-md">
              Create your first task and let AI help you prioritize and schedule your work effectively.
            </p>
            <p className="text-mobile-xs md:text-xs text-muted-foreground/70 text-center mb-6 md:mb-8 max-w-md italic">
              💡 Get started: Add a task and watch AI optimize your schedule!
            </p>
            <Link href="/tasks/new">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary hover:to-primary/90 text-white h-11 md:h-12 text-mobile-base md:text-base px-6 md:px-8 shadow-lg hover:shadow-xl transition-all" 
                data-testid="button-create-first-task"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Create Your First Task
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Other Urgent Tasks */}
      {urgentTasks.length > 1 && (
        <div className="space-y-mobile-md md:space-y-4">
          <h2 className="text-mobile-lg md:text-xl font-semibold text-foreground">Other Urgent Tasks</h2>
          <div className="space-y-mobile-md md:space-y-3">
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