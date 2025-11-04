import { Task } from "@shared/schema";
import { LocalNotifications } from "@capacitor/local-notifications";

export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;
  private notificationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private localNotificationIds: Map<string, number> = new Map();
  private nextNotificationId: number = 1;
  private isCapacitor: boolean = false;

  private constructor() {
    this.isCapacitor = typeof window !== "undefined" && !!window.Capacitor;
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async checkPermission() {
    if (this.isCapacitor) {
      // Check Capacitor local notifications permission
      try {
        const result = await LocalNotifications.checkPermissions();
        this.permissionGranted = result.display === "granted";
      } catch (error) {
        console.warn("Failed to check Capacitor notification permissions:", error);
        this.permissionGranted = false;
      }
    } else if (typeof window !== "undefined" && "Notification" in window && window.Notification) {
      this.permissionGranted = window.Notification.permission === "granted";
    }
  }

  async requestPermission(): Promise<boolean> {
    if (this.isCapacitor) {
      try {
        const result = await LocalNotifications.requestPermissions();
        this.permissionGranted = result.display === "granted";
        return this.permissionGranted;
      } catch (error) {
        console.warn("Failed to request Capacitor notification permission:", error);
        return false;
      }
    }

    if (typeof window === "undefined" || !("Notification" in window) || !window.Notification) {
      console.warn("Notification API not available");
      return false;
    }

    try {
      const permission = await window.Notification.requestPermission();
      this.permissionGranted = permission === "granted";
      return this.permissionGranted;
    } catch (error) {
      console.warn("Failed to request notification permission:", error);
      return false;
    }
  }

  showNotification(title: string, options?: NotificationOptions) {
    if (this.isCapacitor) {
      // Use Capacitor Local Notifications
      this.scheduleLocalNotification(title, options?.body || "", options?.requireInteraction || false);
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window) || !window.Notification) {
      console.warn("Notification API not available");
      return;
    }

    if (!this.permissionGranted) {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      const notification = new window.Notification(title, {
        icon: "/favicon.png",
        badge: "/favicon.png",
        ...options,
      });

      notification.onclick = () => {
        if (typeof window !== "undefined" && window.focus) {
          window.focus();
        }
        notification.close();
      };

      // Auto-close notification after 5 seconds (unless requireInteraction)
      if (!options?.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      console.warn("Failed to show notification:", error);
      return undefined;
    }
  }

  private async scheduleLocalNotification(title: string, body: string, requireInteraction: boolean) {
    if (!this.isCapacitor || !this.permissionGranted) {
      return;
    }

    try {
      const notificationId = this.nextNotificationId++;
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: notificationId,
            schedule: { at: new Date(Date.now() + 100) }, // Schedule immediately
            sound: "default",
            attachments: [],
            actionTypeId: "",
            extra: null,
          },
        ],
      });
      return notificationId;
    } catch (error) {
      console.warn("Failed to schedule local notification:", error);
      return null;
    }
  }

  scheduleTaskReminder(task: Task) {
    if (!task.scheduledStart || task.completed) {
      return;
    }

    const scheduledTime = new Date(task.scheduledStart);
    const now = new Date();
    const timeUntilStart = scheduledTime.getTime() - now.getTime();

    // Clear any existing reminder for this task
    this.clearTaskReminder(task.id);

    // Schedule notification for when task should start
    if (timeUntilStart > 0) {
      if (this.isCapacitor && this.permissionGranted) {
        // Use Capacitor Local Notifications for scheduled reminders
        this.scheduleLocalNotificationForTask(task, scheduledTime);
      } else {
        // Use browser notifications (fallback)
        const timeout = setTimeout(() => {
          this.showNotification(`Time to start: ${task.title}`, {
            body: `This task is scheduled to begin now. Let's get it done!`,
            tag: task.id,
            requireInteraction: true,
          });

          // Start persistent reminders every 15 minutes until completed
          this.startPersistentReminders(task);
        }, timeUntilStart);

        this.notificationIntervals.set(`schedule-${task.id}`, timeout);
      }
    } else {
      // Task time has passed, start reminders immediately
      this.startPersistentReminders(task);
    }
  }

  private async scheduleLocalNotificationForTask(task: Task, scheduledTime: Date) {
    if (!this.isCapacitor || !this.permissionGranted) {
      return;
    }

    try {
      const notificationId = this.nextNotificationId++;
      this.localNotificationIds.set(`schedule-${task.id}`, notificationId);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: `Time to start: ${task.title}`,
            body: `This task is scheduled to begin now. Let's get it done!`,
            id: notificationId,
            schedule: { at: scheduledTime },
            sound: "default",
            attachments: [],
            actionTypeId: "",
            extra: {
              taskId: task.id,
              type: "task-start",
            },
          },
        ],
      });
    } catch (error) {
      console.warn("Failed to schedule local notification for task:", error);
    }
  }

  private startPersistentReminders(task: Task) {
    // Clear any existing interval
    const intervalKey = `reminder-${task.id}`;
    const existingInterval = this.notificationIntervals.get(intervalKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Send reminder every 30 minutes with smarter messages
    const interval = setInterval(() => {
      const now = new Date();
      const scheduledStart = task.scheduledStart ? new Date(task.scheduledStart) : null;
      const hoursSinceStart = scheduledStart ? (now.getTime() - scheduledStart.getTime()) / (1000 * 60 * 60) : 0;
      
      let message = "";
      if (hoursSinceStart > 0 && hoursSinceStart < 1) {
        message = `⏱️ Time to work on this! Have you started "${task.title}"?`;
      } else if (hoursSinceStart >= 1) {
        message = `📋 Are you making progress on "${task.title}"? Quick check-in!`;
      } else {
        message = `✅ Reminder: "${task.title}" is coming up. Get ready!`;
      }
      
      this.showNotification(message, {
        body: task.description ? `"${task.description.substring(0, 50)}..."` : `Priority: ${task.priority}`,
        tag: task.id,
        requireInteraction: false,
      });
    }, 1800000); // 30 minutes for less intrusive reminders

    this.notificationIntervals.set(intervalKey, interval);
  }

  clearTaskReminder(taskId: string) {
    const scheduleKey = `schedule-${taskId}`;
    const reminderKey = `reminder-${taskId}`;

    // Clear browser notification timeouts/intervals
    const scheduleTimeout = this.notificationIntervals.get(scheduleKey);
    if (scheduleTimeout) {
      clearTimeout(scheduleTimeout);
      this.notificationIntervals.delete(scheduleKey);
    }

    const reminderInterval = this.notificationIntervals.get(reminderKey);
    if (reminderInterval) {
      clearInterval(reminderInterval);
      this.notificationIntervals.delete(reminderKey);
    }

    // Clear Capacitor local notifications
    if (this.isCapacitor) {
      const localNotificationId = this.localNotificationIds.get(scheduleKey);
      if (localNotificationId) {
        LocalNotifications.cancel({ notifications: [{ id: localNotificationId }] }).catch(
          (error) => console.warn("Failed to cancel local notification:", error)
        );
        this.localNotificationIds.delete(scheduleKey);
      }
    }
  }

  clearAllReminders() {
    this.notificationIntervals.forEach((timeout) => {
      clearTimeout(timeout);
      clearInterval(timeout);
    });
    this.notificationIntervals.clear();
  }

  notifyTaskDueSoon(task: Task) {
    if (!task.deadline || task.completed) {
      return;
    }

    const deadline = new Date(task.deadline);
    const now = new Date();
    const hoursUntilDue = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
      const urgency = hoursUntilDue <= 2 ? "URGENT" : hoursUntilDue <= 6 ? "High Priority" : "Reminder";
      const body = hoursUntilDue <= 2 
        ? `⚠️ Due in ${Math.round(hoursUntilDue * 60)} minutes! Did you complete this?`
        : `Due in ${Math.round(hoursUntilDue)} hours. Have you started this task?`;

      if (this.isCapacitor && this.permissionGranted) {
        // Schedule local notification for deadline
        this.scheduleLocalNotificationForDeadline(task, deadline, urgency, body);
      } else {
        // Use browser notifications
        this.showNotification(`${urgency}: ${task.title}`, {
          body,
          tag: `deadline-${task.id}`,
          requireInteraction: true,
        });
      }
    }
  }

  private async scheduleLocalNotificationForDeadline(task: Task, deadline: Date, urgency: string, body: string) {
    if (!this.isCapacitor || !this.permissionGranted) {
      return;
    }

    try {
      const notificationId = this.nextNotificationId++;
      this.localNotificationIds.set(`deadline-${task.id}`, notificationId);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: `${urgency}: ${task.title}`,
            body,
            id: notificationId,
            schedule: { at: deadline },
            sound: "default",
            attachments: [],
            actionTypeId: "",
            extra: {
              taskId: task.id,
              type: "deadline",
            },
          },
        ],
      });
    } catch (error) {
      console.warn("Failed to schedule local notification for deadline:", error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
