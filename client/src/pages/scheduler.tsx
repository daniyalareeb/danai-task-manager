import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, Availability, type InsertAvailability } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Calendar, Clock, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Scheduler() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState("4");
  const [startTime, setStartTime] = useState("09:00");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: availability = [], isLoading: availabilityLoading } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
  });

  const addAvailabilityMutation = useMutation({
    mutationFn: async (data: InsertAvailability) => {
      return apiRequest("POST", "/api/availability", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Availability added",
        description: "Your free time has been recorded.",
      });
    },
  });

  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/schedule/generate", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Schedule generated",
        description: "AI has created an optimized schedule for your tasks.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const prioritizeTasksMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tasks/prioritize", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks prioritized",
        description: "AI has analyzed and prioritized your tasks.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to prioritize tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddAvailability = () => {
    if (!date || !hours) return;

    const endTime = startTime ? calculateEndTime(startTime, parseFloat(hours)) : undefined;

    addAvailabilityMutation.mutate({
      date: date as any,
      availableHours: parseFloat(hours),
      startTime,
      endTime,
    });
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const scheduledTasks = tasks.filter(t => t.scheduledStart && !t.completed);

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

  return (
    <div className="space-y-6" data-testid="page-scheduler">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Scheduler</h1>
        <p className="text-muted-foreground mt-1">Let AI optimize your schedule and prioritize your tasks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Set Your Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-availability-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Available Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="4"
                data-testid="input-availability-hours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Preferred Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                data-testid="input-availability-start-time"
              />
            </div>

            <Button
              onClick={handleAddAvailability}
              disabled={addAvailabilityMutation.isPending || !date || !hours}
              className="w-full"
              data-testid="button-add-availability"
            >
              <Clock className="h-4 w-4 mr-2" />
              {addAvailabilityMutation.isPending ? "Adding..." : "Add Availability"}
            </Button>

            {availability.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium">Your Availability</h3>
                <div className="space-y-2">
                  {availability.slice(0, 5).map((avail) => (
                    <div
                      key={avail.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50 text-sm"
                      data-testid={`availability-${avail.id}`}
                    >
                      <span>{format(new Date(avail.date), "MMM d, yyyy")}</span>
                      <Badge variant="secondary">{avail.availableHours}h</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-5 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 animate-pulse" />
                <div className="relative">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Prioritize Tasks
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Let AI analyze your {activeTasks.length} active tasks and determine which ones to focus on first.
                  </p>
                  <Button
                    onClick={() => prioritizeTasksMutation.mutate()}
                    disabled={prioritizeTasksMutation.isPending || activeTasks.length === 0}
                    variant="outline"
                    className="w-full border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30"
                    data-testid="button-prioritize-tasks"
                  >
                    {prioritizeTasksMutation.isPending ? "Analyzing..." : "Prioritize with AI"}
                  </Button>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-900 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 animate-pulse" />
                <div className="relative">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Generate Schedule
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an optimized schedule based on your availability and task priorities.
                  </p>
                  <Button
                    onClick={() => generateScheduleMutation.mutate()}
                    disabled={generateScheduleMutation.isPending || activeTasks.length === 0 || availability.length === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    data-testid="button-generate-schedule"
                  >
                    {generateScheduleMutation.isPending ? "Generating..." : "Generate Schedule"}
                  </Button>
                </div>
              </div>
            </div>

            {scheduledTasks.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium">Scheduled Tasks</h3>
                <div className="space-y-2">
                  {scheduledTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-md bg-muted/50 text-sm"
                      data-testid={`scheduled-task-${task.id}`}
                    >
                      <div className="font-medium">{task.title}</div>
                      {task.scheduledStart && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(task.scheduledStart), "MMM d, h:mm a")}
                          {task.scheduledEnd && ` - ${format(new Date(task.scheduledEnd), "h:mm a")}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {activeTasks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active tasks</h3>
            <p className="text-muted-foreground text-center">
              Create some tasks first, then come back to use AI scheduling.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateEndTime(startTime: string, hours: number): string {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const totalMinutes = startHour * 60 + startMin + hours * 60;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;
  return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
}
