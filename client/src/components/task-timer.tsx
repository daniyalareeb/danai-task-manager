import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@shared/schema";

interface TaskTimerProps {
  task: Task;
  onUpdate?: () => void;
}

export function TaskTimer({ task, onUpdate }: TaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Initialize elapsed time from task's actualDuration
  useEffect(() => {
    if (task.actualDuration) {
      setElapsedMinutes(task.actualDuration);
    }
  }, [task.actualDuration]);

  // Update elapsed time every minute when running
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      setElapsedMinutes((prev) => (task.actualDuration || 0) + diffMinutes);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isRunning, startTime, task.actualDuration]);

  const handleStart = async () => {
    setIsRunning(true);
    setStartTime(new Date());
  };

  const handleStop = async () => {
    if (!startTime) return;

    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const totalMinutes = (task.actualDuration || 0) + diffMinutes;

    try {
      await apiRequest("PATCH", `/api/tasks/${task.id}/timer`, {
        action: "stop",
        minutes: diffMinutes,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setElapsedMinutes(totalMinutes);
      setIsRunning(false);
      setStartTime(null);
      onUpdate?.();
      toast({
        title: "Timer stopped",
        description: `Recorded ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`,
      });
    } catch (error) {
      console.error("Error stopping timer:", error);
      toast({
        title: "Error",
        description: "Failed to update timer",
        variant: "destructive",
      });
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const estimatedMinutes = task.estimatedDuration ? task.estimatedDuration * 60 : null;
  const variance = estimatedMinutes && elapsedMinutes > 0
    ? ((elapsedMinutes - estimatedMinutes) / estimatedMinutes) * 100
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleStart}
            className="h-8"
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleStop}
            className="h-8"
          >
            <Pause className="h-3 w-3 mr-1" />
            Stop
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Time: {formatTime(elapsedMinutes)}</span>
        {estimatedMinutes && (
          <span className="ml-2">
            / {formatTime(estimatedMinutes)}
            {variance !== null && (
              <span className={variance > 0 ? "text-orange-500" : "text-green-500"}>
                {variance > 0 ? ` (+${variance.toFixed(0)}%)` : ` (${variance.toFixed(0)}%)`}
              </span>
            )}
          </span>
        )}
      </div>

      {isRunning && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full animate-pulse">
          Running
        </span>
      )}
    </div>
  );
}



