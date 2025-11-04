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
    // Only schedule reminders if we have permission
    if (typeof window === "undefined" || !("Notification" in window) || !window.Notification || window.Notification.permission !== "granted") {
      return;
    }

    // Schedule reminders for all active scheduled tasks
    const activeTasks = tasks.filter(t => !t.completed && t.scheduledStart);
    
    activeTasks.forEach(task => {
      notificationService.scheduleTaskReminder(task);
    });

    // Check for upcoming deadlines
    const tasksWithDeadlines = tasks.filter(t => !t.completed && t.deadline);
    tasksWithDeadlines.forEach(task => {
      notificationService.notifyTaskDueSoon(task);
    });

    // Cleanup completed tasks' reminders
    const completedTasks = tasks.filter(t => t.completed);
    completedTasks.forEach(task => {
      notificationService.clearTaskReminder(task.id);
    });

    // Cleanup
    return () => {
      // Don't clear all reminders on unmount, only on app close
    };
  }, [tasks]);

  return { notificationService };
}
