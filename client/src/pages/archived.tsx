import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { TaskCard } from "@/components/task-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Archived() {
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { archived: true }],
    queryFn: async () => {
      const response = await fetch("/api/tasks?archived=true");
      if (!response.ok) throw new Error("Failed to fetch archived tasks");
      return response.json();
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}/unarchive`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task unarchived",
        description: "Task has been restored successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unarchive task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Task has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const archivedTasks = tasks.filter((task) => task.archived);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Archived Tasks</h1>
        <p className="text-muted-foreground mt-1">Restore or permanently delete archived tasks</p>
      </div>

      {archivedTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArchiveRestore className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No archived tasks. Tasks you archive will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {archivedTasks.map((task) => (
            <Card key={task.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <TaskCard
                      task={task}
                      onToggleComplete={() => {}}
                      onDelete={() => {}}
                      onArchive={() => {}}
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unarchiveMutation.mutate(task.id)}
                      disabled={unarchiveMutation.isPending}
                    >
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Unarchive
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to permanently delete this task?")) {
                          deleteMutation.mutate(task.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
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

