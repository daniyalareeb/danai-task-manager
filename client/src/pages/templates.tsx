import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskTemplate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Templates() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: templates = [], isLoading } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template deleted",
        description: "Template has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("POST", `/api/tasks/from-template/${templateId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Task created from template successfully.",
      });
      setLocation("/tasks");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task from template.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Templates</h1>
          <p className="text-muted-foreground mt-1">Save and reuse common task structures</p>
        </div>
        <Button
          onClick={() => {
            sessionStorage.setItem("previousLocation", "/templates");
            setLocation("/new-task");
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No templates yet. Create a template from a task to get started.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                sessionStorage.setItem("previousLocation", "/templates");
                setLocation("/new-task");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{template.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createFromTemplateMutation.mutate(template.id)}
                      disabled={createFromTemplateMutation.isPending}
                    >
                      Use Template
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(template.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{template.priority}</Badge>
                    {template.estimatedDuration && (
                      <Badge variant="outline">{template.estimatedDuration}h</Badge>
                    )}
                    {template.category && (
                      <Badge variant="outline">{template.category}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

