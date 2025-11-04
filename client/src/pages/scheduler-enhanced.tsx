import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, Availability } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Clock, Zap, PlayCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarAvailability } from "@/components/calendar-availability";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function Scheduler() {
  const { toast } = useToast();

  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    retry: 1,
    retryDelay: 1000,
  });

  const { data: availability = [], isLoading: availabilityLoading, error: availabilityError, refetch: refetchAvailability } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 1000,
  });

  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await apiRequest("POST", "/api/schedule/generate", {});
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Server may be sleeping.');
        }
        throw error;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Server Error",
        description: error.message || "Server is sleeping. Please try again in a moment.",
        variant: "destructive",
      });
    },
    onSuccess: async (response: Response) => {
      const data = await response.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
      
      const scheduledCount = data?.schedule?.length || 0;
      
      // Show detailed success message with schedule info
      if (scheduledCount > 0) {
        toast({
          title: "✅ Schedule Generated!",
          description: `AI scheduled ${scheduledCount} task${scheduledCount > 1 ? 's' : ''} into your available time slots. Check your calendar!`,
        });
        
        // Send notification for each scheduled task
        if (data?.schedule) {
          data.schedule.forEach((item: any) => {
            const startTime = new Date(item.scheduledStart).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const endTime = new Date(item.scheduledEnd).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const taskTitle = tasks.find(t => t.id === item.taskId)?.title || 'Task';
            
            // Use notification service instead of direct Notification API
            if (typeof window !== "undefined" && "Notification" in window && window.Notification && window.Notification.permission === 'granted') {
              new window.Notification(`📅 Scheduled: ${taskTitle}`, {
                body: `⏰ ${startTime} - ${endTime}\n${item.reasoning || 'AI optimized this time slot for you!'}`,
                icon: '/favicon.png'
              });
            }
          });
        }
      } else {
        toast({
          title: "No Tasks Scheduled",
          description: "No tasks could be fit into your available time slots.",
          variant: "default",
        });
      }
    },
  });

  const deleteAllAvailabilityMutation = useMutation({
    mutationFn: async () => {
      // Delete all availability one by one
      for (const avail of availability) {
        await apiRequest("DELETE", `/api/availability/${avail.id}`, undefined);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      await queryClient.refetchQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Cleared!",
        description: "All availability slots removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear availability.",
        variant: "destructive",
      });
    },
  });

  const prioritizeTasksMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tasks/prioritize", {});
    },
    onError: (error: any) => {
      toast({
        title: "Server Error",
        description: "Server is sleeping. Please try again in a moment.",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks prioritized",
        description: "AI has analyzed and prioritized your tasks.",
      });
    },
  });

  const activeTasks = tasks.filter(t => !t.completed);
  const scheduledTasks = tasks.filter(t => t.scheduledStart && !t.completed);

  // Group scheduled tasks by date
  const tasksByDate = scheduledTasks.reduce((acc, task) => {
    if (!task.scheduledStart) return acc;
    const dateKey = format(new Date(task.scheduledStart), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (tasksLoading || availabilityLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const hasError = tasksError || availabilityError;
  const errorMessage = hasError ? "Server is sleeping. Please try again in a moment." : "";

  return (
    <div className="space-y-6 page-transition pb-20 md:pb-6" data-testid="page-scheduler">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-1">Smart Scheduler</h1>
              <p className="text-white/80 text-lg">AI-powered task scheduling</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
              <Calendar className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-bold text-2xl">{availability.length}</span>
                <span className="text-xs opacity-80">available slots</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
              <Zap className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-bold text-2xl">{activeTasks.length}</span>
                <span className="text-xs opacity-80">active tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
              <Clock className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-bold text-2xl">{scheduledTasks.length}</span>
                <span className="text-xs opacity-80">scheduled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300 font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (tasksError) refetchTasks();
                if (availabilityError) refetchAvailability();
              }}
              className="ml-4 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        {activeTasks.length === 0 && !hasError && (
          <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 dark:border-blue-900 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-700 dark:text-blue-300 font-medium">
              No active tasks. Create some tasks to schedule them!
            </AlertDescription>
          </Alert>
        )}
        
        {availability.length === 0 && !hasError && (
          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 font-medium">
              Set your availability below so AI can schedule your tasks.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-mobile-md md:gap-6">
        {/* Left Column - Calendar Availability */}
        <div className="lg:col-span-2 space-y-mobile-md md:space-y-6">
          <CalendarAvailability />
          
          {/* AI Schedule Actions */}
          <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 border-violet-200 dark:border-violet-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                AI Schedule Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prioritize Tasks */}
              <div className="group relative overflow-hidden rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-gradient-to-br from-violet-50/50 via-white to-violet-50/30 dark:from-violet-950/30 dark:via-background dark:to-violet-950/20 p-7 transition-all hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-2xl hover:scale-[1.02] duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1">Step 1: Prioritize Tasks</h3>
                      <p className="text-sm text-muted-foreground">
                        Let AI analyze and rank your {activeTasks.length} tasks
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => prioritizeTasksMutation.mutate()}
                    disabled={prioritizeTasksMutation.isPending || activeTasks.length === 0}
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 h-12 text-base font-semibold"
                  >
                    {prioritizeTasksMutation.isPending ? "Analyzing..." : "Prioritize Now"}
                  </Button>
                </div>
              </div>

              {/* Generate Schedule */}
              <div className="group relative overflow-hidden rounded-2xl border-2 border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50/50 via-white to-green-50/30 dark:from-green-950/30 dark:via-background dark:to-green-950/20 p-7 transition-all hover:border-green-400 dark:hover:border-green-600 hover:shadow-2xl hover:scale-[1.02] duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <PlayCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1">Step 2: Generate Schedule</h3>
                      <p className="text-sm text-muted-foreground">
                        AI will fit tasks into your available time
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => generateScheduleMutation.mutate()}
                    disabled={generateScheduleMutation.isPending || activeTasks.length === 0 || availability.length === 0}
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 h-12 text-base font-semibold"
                  >
                    {generateScheduleMutation.isPending ? "Scheduling..." : "Generate Schedule"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats & Schedule Preview */}
        <div className="space-y-mobile-md md:space-y-6">
          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-900 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/10 border-2 border-blue-200 dark:border-blue-900 hover:shadow-md transition-all cursor-default">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold">Available Slots</span>
                </div>
                <Badge variant="secondary" className="text-lg font-bold px-3 py-1.5 shadow-sm">
                  {availability.length}
                </Badge>
              </div>
              
              <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border-2 border-amber-200 dark:border-amber-900 hover:shadow-md transition-all cursor-default">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold">Active Tasks</span>
                </div>
                <Badge variant="secondary" className="text-lg font-bold px-3 py-1.5 shadow-sm">
                  {activeTasks.length}
                </Badge>
              </div>
              
              <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-2 border-green-200 dark:border-green-900 hover:shadow-md transition-all cursor-default">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold">Scheduled</span>
                </div>
                <Badge variant="secondary" className="text-lg font-bold px-3 py-1.5 shadow-sm">
                  {scheduledTasks.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-900 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-sm font-bold text-white">1</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Set your weekly availability once, AI uses it automatically</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Prioritize tasks first for better AI scheduling</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Edit or delete any time slot anytime</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visual Schedule */}
      {Object.keys(tasksByDate).length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              Your Generated Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              {Object.keys(tasksByDate).sort().map((dateKey) => {
                const date = new Date(dateKey);
                const tasksForDate = tasksByDate[dateKey].sort((a, b) => {
                  if (!a.scheduledStart || !b.scheduledStart) return 0;
                  return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
                });

                return (
                  <div key={dateKey} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-emerald-200/50 dark:border-emerald-700/50">
                      <Badge variant="outline" className="text-base px-4 py-2 font-bold border-2">
                        {format(date, "EEEE, MMMM d")}
                      </Badge>
                      <div className="h-8 w-px bg-emerald-300 dark:bg-emerald-700" />
                      <span className="text-sm text-muted-foreground font-medium">
                        {tasksForDate.length} task{tasksForDate.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {tasksForDate.map((task) => (
                        <div
                          key={task.id}
                          className="group p-5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50 hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:scale-[1.01]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg mb-2 truncate">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                              )}
                              {task.scheduledStart && task.scheduledEnd && (
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      {format(new Date(task.scheduledStart), "h:mm a")} - {format(new Date(task.scheduledEnd), "h:mm a")}
                                    </span>
                                  </div>
                                  <Badge className="font-bold bg-orange-500 dark:bg-orange-600 text-white">
                                    {task.estimatedDuration || 1}h
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <Badge 
                              className={`text-xs font-bold px-3 py-1.5 ${
                                task.priority === "urgent" ? "bg-red-500 text-white" 
                                : task.priority === "high" ? "bg-orange-500 text-white" 
                                : "bg-blue-500 text-white"
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}