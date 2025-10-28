import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      localStorage.setItem("dantask-notification-permission", "granted");
      toast({
        title: "Notifications enabled",
        description: "You'll receive task reminders and updates.",
      });
      
      // Test notification
      new Notification("DanTask Notifications Enabled", {
        body: "You'll now receive smart reminders for your tasks!",
        icon: "/favicon.png",
      });
    } else {
      localStorage.setItem("dantask-notification-permission", "denied");
      toast({
        title: "Permission denied",
        description: "You won't receive task notifications.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl" data-testid="page-settings">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your DanTask experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how DanTask reminds you about your tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="browser-notifications">Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications for task reminders
              </p>
            </div>
            {notificationsEnabled ? (
              <Badge variant="secondary">Enabled</Badge>
            ) : (
              <Button
                onClick={requestNotificationPermission}
                variant="outline"
                size="sm"
                data-testid="button-enable-notifications"
              >
                Enable
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how DanTask looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Features
          </CardTitle>
          <CardDescription>
            AI-powered task management features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Smart Prioritization</p>
                <p className="text-sm text-muted-foreground">
                  AI analyzes your tasks and suggests which ones to focus on first
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Intelligent Scheduling</p>
                <p className="text-sm text-muted-foreground">
                  Automatically creates an optimized schedule based on your availability
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Persistent Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get reminded about tasks until you complete them
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About DanTask</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            DanTask is your personal AI-powered task manager, designed to help you stay focused
            and productive.
          </p>
          <p>
            Built with advanced AI models from OpenRouter, DanTask intelligently prioritizes
            your work and creates optimized schedules tailored to your availability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
