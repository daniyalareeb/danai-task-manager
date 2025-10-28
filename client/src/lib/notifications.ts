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

    // Send reminder every 15 minutes (900000ms)
    const interval = setInterval(() => {
      this.showNotification(`Reminder: ${task.title}`, {
        body: `Don't forget to complete this task. Stay focused!`,
        tag: task.id,
        requireInteraction: false,
      });
    }, 900000); // 15 minutes

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
      this.showNotification(`Deadline approaching: ${task.title}`, {
        body: `This task is due in ${Math.round(hoursUntilDue)} hours!`,
        tag: `deadline-${task.id}`,
        requireInteraction: true,
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();
