import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNotifications } from "@/hooks/use-notifications";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import NewTask from "@/pages/new-task";
import Scheduler from "@/pages/scheduler-enhanced";
import Scheduled from "@/pages/scheduled";
import Completed from "@/pages/completed";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { QuickAdd } from "@/components/quick-add";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/tasks/new" component={NewTask} />
      <Route path="/scheduler" component={Scheduler} />
      <Route path="/scheduled" component={Scheduled} />
      <Route path="/completed" component={Completed} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  useNotifications();

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <header className="flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-40">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="hover:bg-accent/50 transition-colors" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Router />
        </main>
      </div>
      <QuickAdd />
    </div>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <AppContent />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
