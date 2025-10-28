import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { CheckCircle2, Calendar, ListTodo, Sparkles, Settings, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const [location] = useLocation();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const pendingCount = tasks.filter(t => !t.completed).length;
  const urgentCount = tasks.filter(t => t.priority === "urgent" && !t.completed).length;
  const scheduledCount = tasks.filter(t => t.status === "scheduled" && !t.completed).length;

  const menuItems = [
    {
      title: "Today's Focus",
      url: "/",
      icon: Zap,
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    {
      title: "All Tasks",
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
      title: "AI Scheduler",
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
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">DanTask</h1>
            <p className="text-xs text-muted-foreground">Smart Task Manager</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-sidebar-accent"
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/[']/g, '').replace(/\s+/g, '-')}`}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                      {item.badge !== undefined && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={location === "/settings"} className="data-[active=true]:bg-sidebar-accent">
              <Link href="/settings" data-testid="link-settings">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
