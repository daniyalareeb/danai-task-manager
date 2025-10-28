import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { insertTaskSchema, type InsertTask } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function QuickAdd() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

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
      setTitle("");
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = insertTaskSchema.parse({
      title: title.trim(),
      priority,
      status: "pending",
      completed: false,
    });

    createTaskMutation.mutate(taskData);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 bg-gradient-to-br from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/90 hover:to-primary text-white border-0 relative overflow-hidden group"
            data-testid="button-quick-add"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus className="h-7 w-7 relative z-10" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 shadow-2xl border-0 overflow-hidden" align="end">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
          <div className="relative">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Quick Add Task
                  </h3>
                  <p className="text-xs text-muted-foreground">Create a task in seconds</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="h-12 text-base"
                data-testid="input-quick-add-title"
              />
              
              <div className="flex gap-2">
                {(["low", "medium", "high", "urgent"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className={`flex-1 capitalize transition-all ${
                      priority === p 
                        ? "bg-gradient-to-r from-primary to-primary/90 shadow-md" 
                        : "hover:bg-primary/5"
                    }`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                disabled={createTaskMutation.isPending || !title.trim()}
              >
                {createTaskMutation.isPending ? "Creating..." : "Add Task"}
              </Button>
            </form>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

