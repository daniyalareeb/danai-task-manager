import { Switch, Route, useLocation, Link } from "wouter";
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import NewTask from "@/pages/new-task";
import Scheduler from "@/pages/scheduler-enhanced";
import Scheduled from "@/pages/scheduled";
import Completed from "@/pages/completed";
import Archived from "@/pages/archived";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { QuickAdd } from "@/components/quick-add";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/new-task" component={NewTask} />
      <Route path="/scheduler" component={Scheduler} />
      <Route path="/scheduled" component={Scheduled} />
      <Route path="/completed" component={Completed} />
      <Route path="/archived" component={Archived} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  useNotifications();
  const [location, setLocation] = useLocation();
  const { openMobile, setOpenMobile, isMobile } = useSidebar();
  const { toast } = useToast();

  // Automatic daily carryover on app startup
  useEffect(() => {
    const runAutoCarryover = async () => {
      try {
        // Check if we already ran carryover today
        const lastRunDate = localStorage.getItem("dantask-last-carryover-date");
        const today = new Date().toDateString();
        
        if (lastRunDate === today) {
          // Already ran today, skip
          return;
        }

        // Wait a bit for API to be ready (especially after server sleep)
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await apiRequest("POST", "/api/tasks/auto-carryover", {});
        const data = response as { carryoverCount: number; message: string };
        
        // Mark as run today
        localStorage.setItem("dantask-last-carryover-date", today);

        // Show toast if tasks were carried over
        if (data.carryoverCount > 0) {
          toast({
            title: "Tasks Rescheduled",
            description: data.message,
            duration: 5000,
          });
          
          // Refetch tasks to show updated schedule
          await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
        }
      } catch (error) {
        console.warn("Auto-carryover failed (server may be sleeping):", error);
        // Don't show error to user - this is a background operation
      }
    };

    runAutoCarryover();
  }, []); // Run once on app startup

  // Handle Android back button
  useEffect(() => {
    // Only register back button handler in Capacitor environment
    if (typeof window !== "undefined" && window.Capacitor && CapacitorApp) {
      let listener: any = null;
      
      // Wait a bit for Capacitor to fully initialize
      const timeoutId = setTimeout(async () => {
        try {
          listener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
            // If sidebar is open on mobile, close it first
            if (isMobile && openMobile) {
              setOpenMobile(false);
              return;
            }

            // If not on dashboard, navigate back
            if (location !== "/") {
              // Use browser history if available
              if (window.history.length > 1) {
                window.history.back();
              } else {
                // Otherwise navigate to dashboard
                setLocation("/");
              }
            } else {
              // On dashboard, allow app to exit (default behavior)
              CapacitorApp.exitApp();
            }
          });
        } catch (error) {
          console.warn("Failed to register back button listener:", error);
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (listener && listener.remove) {
          listener.remove();
        }
      };
    }
  }, [location, isMobile, openMobile, setOpenMobile, setLocation]);

  return (
    <div className="flex h-screen h-dvh w-full bg-background overflow-hidden max-w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative max-w-full min-w-0">
        <header className="flex items-center justify-between p-mobile-sm md:p-4 border-b border-border/50 backdrop-blur-md bg-background/95 sticky top-0 z-40 w-full max-w-full flex-shrink-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="md:flex hidden hover:bg-accent/50 transition-colors min-h-[44px] min-w-[44px] flex-shrink-0" />
            <div className="md:hidden flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
              <h1 className="text-mobile-lg font-bold text-foreground">Daniyal To-Do</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings" className="md:hidden">
              <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none p-mobile-md md:p-6 w-full max-w-full min-w-0 md:pb-6" style={{ 
          overscrollBehavior: 'none', 
          WebkitOverflowScrolling: 'touch', 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
          marginBottom: 0
        }}>
          <Router />
        </main>
      </div>
      <MobileBottomNav />
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
      <ThemeProvider defaultTheme="dark">
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
