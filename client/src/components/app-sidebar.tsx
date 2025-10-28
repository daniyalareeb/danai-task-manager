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
import { PWAInstall } from "./pwa-install";

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
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50 bg-gradient-to-br from-primary/5 to-primary/0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-sidebar-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Daniyal To-Do
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Smart Task Manager</p>
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
      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        <PWAInstall />
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
