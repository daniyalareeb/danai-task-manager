/**
 * New Task Page
 * 
 * Allows users to create new tasks with:
 * - Task title, description, priority, deadline, estimated duration
 * - Automatic navigation back to previous page after creation
 * - Browser history support for natural back button behavior
 * 
 * Navigation Logic:
 * - Stores previous location in sessionStorage when navigating to this page
 * - Uses browser history.back() when available for native navigation
 * - Falls back to programmatic navigation if history unavailable
 */

import { useMutation } from "@tanstack/react-query";
import { type InsertTask, type InsertTaskTemplate } from "@shared/schema";
import { TaskForm } from "@/components/task-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function NewTask() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [templateName, setTemplateName] = useState("");

  /**
   * Retrieves the previous location from sessionStorage
   * Falls back to dashboard (/) if no previous location stored
   * @returns The previous route path
   */
  const getPreviousLocation = () => {
    const stored = sessionStorage.getItem("previousLocation");
    return stored || "/";
  };

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
      // Go back to previous location or use browser history
      const previousLocation = getPreviousLocation();
      if (window.history.length > 1 && previousLocation !== location) {
        window.history.back();
      } else {
        setLocation(previousLocation);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const templateData: InsertTaskTemplate = {
        name: templateName || data.title,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        estimatedDuration: data.estimatedDuration || undefined,
        category: data.category || undefined,
      };
      return apiRequest("POST", "/api/templates", templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template saved",
        description: "Template has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveAsTemplate = async (data: InsertTask) => {
    if (!templateName && !data.title) {
      toast({
        title: "Error",
        description: "Please provide a template name or task title.",
        variant: "destructive",
      });
      return;
    }
    await createTemplateMutation.mutateAsync(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="page-new-task">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // Use browser history if available, otherwise go to previous location or dashboard
            if (window.history.length > 1) {
              window.history.back();
            } else {
              const previousLocation = getPreviousLocation();
              setLocation(previousLocation);
            }
          }}
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
        onSaveAsTemplate={handleSaveAsTemplate}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
      />
    </div>
  );
}
