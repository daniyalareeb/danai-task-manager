import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, Moon, Sun, Sparkles, MoonStar } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/lib/notifications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [dndStartHour, setDndStartHour] = useState<string>("23");
  const [dndEndHour, setDndEndHour] = useState<string>("8");

  // Load do not disturb settings from localStorage
  useEffect(() => {
    const savedDndStart = localStorage.getItem("dantask-dnd-start");
    const savedDndEnd = localStorage.getItem("dantask-dnd-time");
    if (savedDndStart) {
      setDndStartHour(savedDndStart);
    }
    if (savedDndEnd) {
      setDndEndHour(savedDndEnd);
    }
  }, []);

  useEffect(() => {
    // Check notification permission status
    const checkPermission = async () => {
      setIsChecking(true);
      try {
        // Use notificationService which handles both browser and Capacitor
        const isCapacitor = typeof window !== "undefined" && window.Capacitor !== undefined;
        
        if (isCapacitor) {
          // For Capacitor, check via LocalNotifications
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          const result = await LocalNotifications.checkPermissions();
          setNotificationsEnabled(result.display === "granted");
        } else if (typeof window !== "undefined" && "Notification" in window && window.Notification) {
          // For browser, check Notification API
          setNotificationsEnabled(window.Notification.permission === "granted");
        } else {
          setNotificationsEnabled(false);
        }
      } catch (error) {
        console.warn("Failed to check notification permission:", error);
        setNotificationsEnabled(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        setNotificationsEnabled(true);
        localStorage.setItem("dantask-notification-permission", "granted");
        toast({
          title: "Notifications enabled",
          description: "You'll receive task reminders and updates.",
        });
        
        // Show test notification
        notificationService.showNotification("DanTask Notifications Enabled", {
          body: "You'll now receive smart reminders for your tasks!",
        });
      } else {
        setNotificationsEnabled(false);
        localStorage.setItem("dantask-notification-permission", "denied");
        toast({
          title: "Permission denied",
          description: "You won't receive task notifications.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
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
            {isChecking ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : notificationsEnabled ? (
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

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="dnd-start">Do Not Disturb Start Time</Label>
              <p className="text-sm text-muted-foreground">
                No notifications will be sent after this time until the end time
              </p>
              <Select value={dndStartHour} onValueChange={(value) => {
                setDndStartHour(value);
                localStorage.setItem("dantask-dnd-start", value);
                toast({
                  title: "Setting saved",
                  description: "Do not disturb time updated.",
                });
              }}>
                <SelectTrigger id="dnd-start" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i === 0 ? "12:00 AM (Midnight)" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM (Noon)" : `${i - 12}:00 PM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dnd-end">Do Not Disturb End Time</Label>
              <p className="text-sm text-muted-foreground">
                Notifications will resume after this time in the morning
              </p>
              <Select value={dndEndHour} onValueChange={(value) => {
                setDndEndHour(value);
                notificationService.setDoNotDisturbEnd(parseInt(value, 10));
                toast({
                  title: "Setting saved",
                  description: "Do not disturb end time updated.",
                });
              }}>
                <SelectTrigger id="dnd-end" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i === 0 ? "12:00 AM (Midnight)" : `${i}:00 AM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
