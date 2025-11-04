import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Sparkles, Trash2, Edit, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  showAiInsights?: boolean;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent text-accent-foreground",
  high: "bg-primary/20 text-primary",
  urgent: "bg-destructive/20 text-destructive",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function TaskCard({ task, onToggleComplete, onDelete, onEdit, showAiInsights = false }: TaskCardProps) {
  const isCompleted = task.completed;
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isCompleted;
  
  // Priority border colors - thicker and more visible
  const priorityBorderColors = {
    urgent: "border-l-[6px] border-l-red-600 dark:border-l-red-500",
    high: "border-l-[6px] border-l-orange-600 dark:border-l-orange-500",
    medium: "border-l-[6px] border-l-yellow-500 dark:border-l-yellow-400",
    low: "border-l-[6px] border-l-green-600 dark:border-l-green-500",
  };
  
  const borderColor = priorityBorderColors[task.priority as keyof typeof priorityBorderColors] || "";
  
  // Check if task is due today
  const isDueToday = task.deadline && !isCompleted && (() => {
    const deadline = new Date(task.deadline);
    const today = new Date();
    return deadline.toDateString() === today.toDateString();
  })();

  return (
    <Card className={`hover:shadow-xl hover:scale-[1.01] transition-all duration-300 bg-card border-border/50 w-full max-w-full overflow-x-hidden hover-elevate active-elevate-2 ${isCompleted ? "opacity-60" : ""} ${isOverdue ? "border-destructive/50 ring-2 ring-destructive/20" : ""} ${borderColor} ${task.priority === "urgent" && !isCompleted ? "hover:ring-2 hover:ring-destructive/30" : ""}`} data-testid={`card-task-${task.id}`}>
      <CardHeader className="flex flex-row items-start gap-mobile-md md:gap-4 space-y-0 pb-3 p-mobile-md md:p-6">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
          className="mt-1 h-5 w-5 md:h-6 md:w-6 min-h-[44px] min-w-[44px] flex-shrink-0"
          data-testid={`checkbox-task-${task.id}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className={`font-semibold text-mobile-base md:text-base text-foreground ${isCompleted ? "line-through" : ""}`} data-testid={`text-task-title-${task.id}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-mobile-xs md:text-xs px-2 py-0.5`}>
                {priorityLabels[task.priority as keyof typeof priorityLabels]}
              </Badge>
              {isDueToday && (
                <Badge className="bg-blue-500 text-white dark:bg-blue-600 dark:text-white text-mobile-xs md:text-xs px-2.5 py-1 font-semibold shadow-sm">
                  Due today
                </Badge>
              )}
              {isOverdue && (
                <Badge className="bg-red-600 text-white dark:bg-red-500 dark:text-white text-mobile-xs md:text-xs px-2.5 py-1 font-semibold shadow-sm">
                  Overdue
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-9 w-9 md:h-10 md:w-10 min-h-[44px] min-w-[44px]" data-testid={`button-task-menu-${task.id}`}>
                    <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(task)} data-testid={`button-edit-task-${task.id}`} className="min-h-[44px]">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-destructive min-h-[44px]"
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {task.description && (
            <p className="text-mobile-xs md:text-sm text-muted-foreground mt-2 leading-relaxed" data-testid={`text-task-description-${task.id}`}>
              {task.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pl-11 md:pl-14 p-mobile-md md:p-6 pb-mobile-md md:pb-6">
        <div className="flex flex-wrap gap-2 md:gap-3 text-mobile-xs md:text-sm">
          {task.estimatedDuration && (
            <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-medium" data-testid={`text-task-duration-${task.id}`}>
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span>{task.estimatedDuration}h</span>
            </div>
          )}
          {task.deadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`} data-testid={`text-task-deadline-${task.id}`}>
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              <span>{format(new Date(task.deadline), "MMM d, yyyy")}</span>
            </div>
          )}
          {task.scheduledStart && (
            <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-medium" data-testid={`text-task-scheduled-${task.id}`}>
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              <span>
                {format(new Date(task.scheduledStart), "MMM d, h:mm a")}
                {task.scheduledEnd && ` - ${format(new Date(task.scheduledEnd), "h:mm a")}`}
              </span>
            </div>
          )}
        </div>
        {showAiInsights && task.aiReasoning && (
          <div className="mt-3 md:mt-4 p-mobile-md md:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden group" data-testid={`text-ai-reasoning-${task.id}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse" />
            <div className="flex items-start gap-3 relative">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-mobile-xs md:text-xs font-semibold text-primary mb-1 md:mb-1.5">AI Insight</p>
                <p className="text-mobile-xs md:text-sm text-foreground leading-relaxed">{task.aiReasoning}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
