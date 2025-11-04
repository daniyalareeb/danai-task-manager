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
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] safe-area-bottom" style={{ position: 'fixed', bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))', right: 'max(1rem, env(safe-area-inset-right, 1rem))' }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="lg" 
            className="h-16 w-16 md:h-20 md:w-20 rounded-full shadow-2xl hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] hover:scale-110 active:scale-95 transition-all duration-300 bg-gradient-to-br from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/90 hover:to-primary text-white border-0 relative overflow-visible group min-h-[64px] min-w-[64px] ring-4 ring-primary/20 dark:ring-primary/30 backdrop-blur-sm flex items-center justify-center"
            data-testid="button-quick-add"
            aria-label="Add new task"
          >
            {/* Outer glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/40 to-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
            
            {/* Inner gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            
            {/* Plus icon - made more prominent and visible */}
            <div className="relative z-10 flex items-center justify-center">
              <Plus className="h-8 w-8 md:h-10 md:w-10 text-white stroke-[4] drop-shadow-2xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
              {/* Additional inner highlight for better visibility */}
              <Plus className="absolute h-8 w-8 md:h-10 md:w-10 text-white/80 stroke-[2.5] blur-[1px]" />
            </div>
            
            {/* Pulse animation ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-0 group-hover:opacity-100" style={{ animationDuration: '2s' }} />
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

