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

  return (
    <Card className={`hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ${isCompleted ? "opacity-60" : ""} ${isOverdue ? "border-destructive/50 animate-pulse" : ""}`} data-testid={`card-task-${task.id}`}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
          className="mt-1 h-5 w-5"
          data-testid={`checkbox-task-${task.id}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className={`font-medium text-base ${isCompleted ? "line-through" : ""}`} data-testid={`text-task-title-${task.id}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                {priorityLabels[task.priority as keyof typeof priorityLabels]}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-task-menu-${task.id}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(task)} data-testid={`button-edit-task-${task.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-destructive"
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
            <p className="text-sm text-muted-foreground mt-2" data-testid={`text-task-description-${task.id}`}>
              {task.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pl-14">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {task.estimatedDuration && (
            <div className="flex items-center gap-1" data-testid={`text-task-duration-${task.id}`}>
              <Clock className="h-4 w-4" />
              <span>{task.estimatedDuration}h</span>
            </div>
          )}
          {task.deadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`} data-testid={`text-task-deadline-${task.id}`}>
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(task.deadline), "MMM d, yyyy")}</span>
            </div>
          )}
          {task.scheduledStart && (
            <div className="flex items-center gap-1" data-testid={`text-task-scheduled-${task.id}`}>
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(task.scheduledStart), "MMM d, h:mm a")}
                {task.scheduledEnd && ` - ${format(new Date(task.scheduledEnd), "h:mm a")}`}
              </span>
            </div>
          )}
        </div>
        {showAiInsights && task.aiReasoning && (
          <div className="mt-3 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden group" data-testid={`text-ai-reasoning-${task.id}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse" />
            <div className="flex items-start gap-3 relative">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-primary mb-1.5">AI Insight</p>
                <p className="text-sm text-foreground leading-relaxed">{task.aiReasoning}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
