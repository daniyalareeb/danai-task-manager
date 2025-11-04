import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { notificationService } from "@/lib/notifications";

export function useNotifications() {
  const [permissionRequested, setPermissionRequested] = useState(false);
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  useEffect(() => {
    // Request notification permission on first load if not already done
    const requestPermission = async () => {
      if (typeof window === "undefined" || !("Notification" in window) || !window.Notification) {
        setPermissionRequested(true);
        return;
      }

      if (!permissionRequested) {
        const hasStoredPreference = localStorage.getItem("dantask-notification-permission");
        
        // Only auto-request if user hasn't explicitly denied before
        if (!hasStoredPreference && window.Notification.permission === "default") {
          const granted = await notificationService.requestPermission();
          localStorage.setItem("dantask-notification-permission", granted ? "granted" : "denied");
          setPermissionRequested(true);
        } else {
          setPermissionRequested(true);
        }
      }
    };

    requestPermission();
  }, [permissionRequested]);

  useEffect(() => {
    // Check permission status (both browser and Capacitor)
    const checkAndSchedule = async () => {
      // Check if we have permission (browser or Capacitor)
      const isCapacitor = typeof window !== "undefined" && !!window.Capacitor;
      let hasPermission = false;

      if (isCapacitor) {
        // Check Capacitor permission
        try {
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          const result = await LocalNotifications.checkPermissions();
          hasPermission = result.display === "granted";
        } catch (error) {
          console.warn("Failed to check Capacitor notification permissions:", error);
        }
      } else if (typeof window !== "undefined" && "Notification" in window && window.Notification) {
        hasPermission = window.Notification.permission === "granted";
      }

      if (!hasPermission) {
        return; // No permission, skip scheduling
      }

      // Update persistent reminders for all tasks
      // This will reschedule reminders for incomplete tasks (handles app reopen scenario)
      // and stop them for completed tasks
      for (const task of tasks) {
        await notificationService.updatePersistentReminders(task);
      }

      // Schedule initial reminders for all active scheduled tasks
      const activeTasks = tasks.filter(t => !t.completed && t.scheduledStart);
      
      for (const task of activeTasks) {
        await notificationService.scheduleTaskReminder(task);
      }

      // Check for upcoming deadlines (multiple reminders at 1h, 30m, 5m before deadline)
      const tasksWithDeadlines = tasks.filter(t => !t.completed && t.deadline);
      for (const task of tasksWithDeadlines) {
        await notificationService.notifyTaskDueSoon(task);
      }

      // Cleanup completed tasks' reminders
      const completedTasks = tasks.filter(t => t.completed);
      for (const task of completedTasks) {
        await notificationService.clearTaskReminder(task.id);
      }
    };

    checkAndSchedule().catch(error => {
      console.warn("Error scheduling notifications:", error);
    });

    // Cleanup
    return () => {
      // Don't clear all reminders on unmount, only on app close
    };
  }, [tasks]);

  return { notificationService };
}
