import { Link, useLocation } from "wouter";
import { Zap, ListTodo, Calendar, Sparkles, CheckCircle2, Archive, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const [location] = useLocation();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const pendingCount = tasks.filter(t => !t.completed && !t.archived).length;
  const urgentCount = tasks.filter(t => t.priority === "urgent" && !t.completed && !t.archived).length;
  const scheduledCount = tasks.filter(t => t.scheduledStart && !t.completed && !t.archived).length;

  const navItems = [
    {
      title: "Today",
      url: "/",
      icon: Zap,
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: ListTodo,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      title: "Scheduled",
      url: "/scheduled",
      icon: Calendar,
      badge: scheduledCount > 0 ? scheduledCount : undefined,
    },
    {
      title: "Scheduler",
      url: "/scheduler",
      icon: Sparkles,
    },
    {
      title: "Completed",
      url: "/completed",
      icon: CheckCircle2,
    },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] border-t border-border safe-area-bottom"
      style={{ 
        backgroundColor: 'hsl(var(--background))',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
        minHeight: '4rem'
      }}
    >
      <div className="flex items-center justify-around h-16 px-2" style={{ height: '4rem' }}>
        {navItems.map((item) => {
          const isActive = location === item.url;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.title}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

