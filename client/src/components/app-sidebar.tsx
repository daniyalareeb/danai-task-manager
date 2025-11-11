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
  useSidebar,
} from "@/components/ui/sidebar";
import { CheckCircle2, Calendar, ListTodo, Sparkles, Settings, Zap, Archive } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { PWAInstall } from "./pwa-install";

function SidebarLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: any }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [location] = useLocation();

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}

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
    {
      title: "Archived",
      url: "/archived",
      icon: Archive,
    },
  ];

  return (
    <Sidebar className="border-r border-border/50 hidden md:flex">
      <SidebarHeader className="p-3 md:p-4 border-b border-sidebar-border/50 bg-gradient-to-br from-primary/5 to-primary/0 safe-area-top pt-[calc(env(safe-area-inset-top)+0.75rem)] md:pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
            <img src="/logo.svg" alt="Logo" className="w-full h-full" />
          </div>
          <div>
            <h1 className="font-bold text-mobile-base md:text-xl text-sidebar-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Daniyal To-Do
            </h1>
            <p className="text-mobile-xs md:text-xs text-muted-foreground font-medium">Smart Task Manager</p>
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
                    className="data-[active=true]:bg-sidebar-accent min-h-[44px]"
                  >
                    <SidebarLink href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/[']/g, '').replace(/\s+/g, '-')}`}>
                      <item.icon className="w-5 h-5" />
                      <span className="text-mobile-sm md:text-sm">{item.title}</span>
                      {item.badge !== undefined && (
                        <Badge variant="secondary" className="ml-auto text-mobile-xs md:text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarLink>
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
            <SidebarMenuButton asChild data-active={location === "/settings"} className="data-[active=true]:bg-sidebar-accent min-h-[44px]">
              <SidebarLink href="/settings" data-testid="link-settings">
                <Settings className="w-5 h-5" />
                <span className="text-mobile-sm md:text-sm">Settings</span>
              </SidebarLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
