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
    onSuccess: async () => {
      // Invalidate and refetch to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
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
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[90] safe-area-bottom" style={{ position: 'fixed', bottom: 'max(5rem, calc(env(safe-area-inset-bottom, 1rem) + 4rem))', right: 'max(1rem, env(safe-area-inset-right, 1rem))' }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="lg" 
            className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 bg-primary text-white border-0 flex items-center justify-center font-bold"
            data-testid="button-quick-add"
            aria-label="Add new task"
          >
            <Plus className="h-7 w-7 md:h-8 md:w-8 stroke-[5] stroke-white" style={{ 
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
              color: 'white',
              fill: 'none'
            }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] max-w-80 p-0 shadow-2xl border-0 overflow-hidden md:w-80 max-w-[calc(100vw-1rem)]" align="end">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
          <div className="relative">
            <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-3 md:space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-mobile-base md:text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Quick Add Task
                  </h3>
                  <p className="text-mobile-xs md:text-xs text-muted-foreground">Create a task in seconds</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="rounded-full min-h-[44px] min-w-[44px]"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
              
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="h-11 md:h-12 text-mobile-base md:text-base min-h-[44px]"
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
                    className={`flex-1 capitalize transition-all min-h-[44px] text-mobile-xs md:text-sm ${
                      priority === p 
                        ? "bg-gradient-to-r from-primary to-primary/90 shadow-md text-white" 
                        : "hover:bg-primary/5"
                    }`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md h-11 md:h-12 text-mobile-base md:text-base min-h-[44px]"
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

