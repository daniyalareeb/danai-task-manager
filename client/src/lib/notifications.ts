import { Task } from "@shared/schema";

export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;
  private notificationIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async checkPermission() {
    if ("Notification" in window) {
      this.permissionGranted = Notification.permission === "granted";
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permissionGranted = permission === "granted";
    return this.permissionGranted;
  }

  showNotification(title: string, options?: NotificationOptions) {
    if (!this.permissionGranted) {
      console.warn("Notification permission not granted");
      return;
    }

    const notification = new Notification(title, {
      icon: "/favicon.png",
      badge: "/favicon.png",
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close notification after 5 seconds (unless requireInteraction)
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
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
    } else {
      // Task time has passed, start reminders immediately
      this.startPersistentReminders(task);
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
      
      this.showNotification(`${urgency}: ${task.title}`, {
        body: hoursUntilDue <= 2 
          ? `⚠️ Due in ${Math.round(hoursUntilDue * 60)} minutes! Did you complete this?`
          : `Due in ${Math.round(hoursUntilDue)} hours. Have you started this task?`,
        tag: `deadline-${task.id}`,
        requireInteraction: true,
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();
