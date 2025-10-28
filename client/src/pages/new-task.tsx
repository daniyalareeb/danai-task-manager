import { useMutation } from "@tanstack/react-query";
import { type InsertTask } from "@shared/schema";
import { TaskForm } from "@/components/task-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewTask() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
      setLocation("/tasks");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="page-new-task">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/tasks")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
          <p className="text-muted-foreground mt-1">Add a task and let AI help you prioritize</p>
        </div>
      </div>

      <TaskForm
        onSubmit={(data) => createTaskMutation.mutate(data)}
        isLoading={createTaskMutation.isPending}
      />
    </div>
  );
}
