import { Task } from "@shared/schema";
import { LocalNotifications } from "@capacitor/local-notifications";

export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;
  private notificationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private localNotificationIds: Map<string, number> = new Map();
  private nextNotificationId: number = 1;
  private isCapacitor: boolean = false;
  private doNotDisturbEnd: number = 8; // Default: 8 AM (next morning)

  private constructor() {
    this.isCapacitor = typeof window !== "undefined" && !!window.Capacitor;
    this.checkPermission();
    // Load do not disturb time from localStorage
    const savedDndTime = localStorage.getItem("dantask-dnd-time");
    if (savedDndTime) {
      this.doNotDisturbEnd = parseInt(savedDndTime, 10);
    }
  }

  /**
   * Get the current do not disturb end time (hour of day, 0-23)
   */
  getDoNotDisturbEnd(): number {
    return this.doNotDisturbEnd;
  }

  /**
   * Set the do not disturb end time (hour of day, 0-23)
   */
  setDoNotDisturbEnd(hour: number) {
    this.doNotDisturbEnd = hour;
    localStorage.setItem("dantask-dnd-time", hour.toString());
  }

  /**
   * Check if we're currently in do not disturb period
   * Do not disturb starts at the set time and ends at doNotDisturbEnd (next morning)
   */
  isInDoNotDisturbPeriod(dndStartHour: number): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    
    // If current hour is between dndStartHour and midnight, or between midnight and doNotDisturbEnd
    if (dndStartHour <= 23) {
      // Normal case: dndStartHour is before midnight
      return currentHour >= dndStartHour || currentHour < this.doNotDisturbEnd;
    } else {
      // Edge case: dndStartHour wraps around midnight
      return currentHour >= dndStartHour || currentHour < this.doNotDisturbEnd;
    }
  }

  /**
   * Check if we should send a notification based on do not disturb settings
   */
  shouldSendNotification(dndStartHour?: number): boolean {
    if (dndStartHour === undefined) {
      // Get from localStorage if not provided
      const savedDndStart = localStorage.getItem("dantask-dnd-start");
      dndStartHour = savedDndStart ? parseInt(savedDndStart, 10) : 23; // Default: 11 PM
    }
    
    return !this.isInDoNotDisturbPeriod(dndStartHour);
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
    // Check do not disturb before showing notification
    const savedDndStart = localStorage.getItem("dantask-dnd-start");
    const dndStartHour = savedDndStart ? parseInt(savedDndStart, 10) : 23; // Default: 11 PM
    
    if (!this.shouldSendNotification(dndStartHour)) {
      // Skip notification during do not disturb period
      return;
    }

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

    // Check if scheduled time is in do not disturb period
    const savedDndStart = localStorage.getItem("dantask-dnd-start");
    const dndStartHour = savedDndStart ? parseInt(savedDndStart, 10) : 23;
    
    // Check if the scheduled time falls within do not disturb period
    const scheduledHour = scheduledTime.getHours();
    if (scheduledHour >= dndStartHour || scheduledHour < this.doNotDisturbEnd) {
      // If notification would be in DND period, schedule it for after DND ends
      const dndEndTime = new Date(scheduledTime);
      if (scheduledHour >= dndStartHour) {
        // Scheduled time is in DND, move to next morning
        dndEndTime.setDate(dndEndTime.getDate() + 1);
      }
      dndEndTime.setHours(this.doNotDisturbEnd, 0, 0, 0);
      scheduledTime = dndEndTime;
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

  private async startPersistentReminders(task: Task) {
    // Clear any existing reminders first
    await this.clearTaskReminder(task.id);

    if (!task.scheduledStart) {
      return; // No scheduled time, can't set reminders
    }

    const taskId = task.id;
    const taskTitle = task.title;
    const taskDescription = task.description;
    const taskPriority = task.priority;
    const scheduledStartTime = new Date(task.scheduledStart);
    const now = new Date();

    // Calculate end time: either 24 hours from now, or estimated end time if available
    let endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    if (task.scheduledEnd) {
      const scheduledEnd = new Date(task.scheduledEnd);
      if (scheduledEnd.getTime() > now.getTime()) {
        endTime = scheduledEnd;
      }
    }

    // Get do not disturb settings
    const savedDndStart = localStorage.getItem("dantask-dnd-start");
    const dndStartHour = savedDndStart ? parseInt(savedDndStart, 10) : 23; // Default: 11 PM

    // Schedule notifications every 30 minutes
    const notifications: any[] = [];
    let currentTime = new Date(now);
    
    // Start from next 30-minute interval
    const minutes = currentTime.getMinutes();
    const nextInterval = minutes < 30 ? 30 : 60;
    currentTime.setMinutes(nextInterval > 60 ? 0 : nextInterval, 0, 0);
    if (nextInterval === 60) {
      currentTime.setHours(currentTime.getHours() + 1);
    }

    let notificationIndex = 0;
    while (currentTime.getTime() <= endTime.getTime()) {
      // Check if this time is in do not disturb period
      const notificationHour = currentTime.getHours();
      if (notificationHour >= dndStartHour || notificationHour < this.doNotDisturbEnd) {
        // Skip notifications during DND, move to after DND ends
        const dndEndTime = new Date(currentTime);
        if (notificationHour >= dndStartHour) {
          dndEndTime.setDate(dndEndTime.getDate() + 1);
        }
        dndEndTime.setHours(this.doNotDisturbEnd, 0, 0, 0);
        if (dndEndTime.getTime() > endTime.getTime()) {
          break; // DND ends after task end time
        }
        currentTime = dndEndTime;
        continue;
      }

      // Calculate hours since scheduled start
      const hoursSinceStart = (currentTime.getTime() - scheduledStartTime.getTime()) / (1000 * 60 * 60);
      
      let title = "";
      let body = "";
      if (hoursSinceStart < 0) {
        // Before scheduled time
        const minutesUntil = Math.abs(Math.round(hoursSinceStart * 60));
        title = `✅ Reminder: "${taskTitle}"`;
        body = `Coming up in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}. Get ready!`;
      } else if (hoursSinceStart >= 0 && hoursSinceStart < 1) {
        title = `⏱️ Time to work on this!`;
        body = `Have you started "${taskTitle}"?`;
      } else {
        title = `📋 Progress check-in`;
        body = `Are you making progress on "${taskTitle}"?`;
      }

      if (this.isCapacitor && this.permissionGranted) {
        // Use Capacitor LocalNotifications
        const notificationId = this.nextNotificationId++;
        const reminderKey = `reminder-${taskId}-${notificationIndex}`;
        this.localNotificationIds.set(reminderKey, notificationId);

        notifications.push({
          title,
          body: taskDescription ? `${body}\n"${taskDescription.substring(0, 50)}..."` : `${body}\nPriority: ${taskPriority}`,
          id: notificationId,
          schedule: { at: new Date(currentTime) },
          sound: "default",
          attachments: [],
          actionTypeId: "",
          extra: {
            taskId,
            type: "persistent-reminder",
          },
        });
      } else if (!this.isCapacitor && this.permissionGranted && typeof window !== "undefined" && "Notification" in window && window.Notification) {
        // Browser fallback: use setInterval for browser (since scheduled notifications aren't as reliable)
        const intervalKey = `reminder-${taskId}-${notificationIndex}`;
        const delay = currentTime.getTime() - now.getTime();
        
        if (delay > 0) {
          const timeout = setTimeout(() => {
            if (this.shouldSendNotification(dndStartHour)) {
              this.showNotification(title, {
                body: taskDescription ? `${body}\n"${taskDescription.substring(0, 50)}..."` : `${body}\nPriority: ${taskPriority}`,
                tag: taskId,
                requireInteraction: false,
              });
            }
          }, delay);
          this.notificationIntervals.set(intervalKey, timeout);
        }
      }

      // Move to next 30-minute interval
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
      notificationIndex++;
    }

    // Schedule all notifications at once for Capacitor
    if (this.isCapacitor && this.permissionGranted && notifications.length > 0) {
      try {
        await LocalNotifications.schedule({
          notifications,
        });
        console.log(`[Notifications] Scheduled ${notifications.length} persistent reminders for task "${taskTitle}"`);
      } catch (error) {
        console.warn("Failed to schedule persistent reminders:", error);
      }
    }
  }

  /**
   * Update persistent reminders for a task (call this when task status changes)
   * This will stop reminders if task is completed, or reschedule if incomplete
   */
  async updatePersistentReminders(task: Task) {
    if (task.completed) {
      // Task is completed, stop reminders
      await this.clearTaskReminder(task.id);
    } else {
      // Task is still incomplete, ensure reminders are scheduled
      if (!task.scheduledStart) {
        // If no scheduled time, don't start persistent reminders
        return;
      }
      // Always reschedule reminders (this handles app reopen scenario)
      await this.startPersistentReminders(task);
    }
  }

  async clearTaskReminder(taskId: string) {
    const scheduleKey = `schedule-${taskId}`;

    // Clear browser notification timeouts/intervals
    const scheduleTimeout = this.notificationIntervals.get(scheduleKey);
    if (scheduleTimeout) {
      clearTimeout(scheduleTimeout);
      this.notificationIntervals.delete(scheduleKey);
    }

    // Clear all persistent reminder intervals/timeouts for this task
    const keysToDelete: string[] = [];
    this.notificationIntervals.forEach((value, key) => {
      if (key.startsWith(`reminder-${taskId}-`)) {
        if (typeof value === "number") {
          clearTimeout(value);
        } else {
          clearInterval(value);
        }
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.notificationIntervals.delete(key));

    // Clear Capacitor local notifications
    if (this.isCapacitor) {
      // Cancel all scheduled notifications for this task
      const notificationIdsToCancel: number[] = [];
      
      // Get all notification IDs for this task
      this.localNotificationIds.forEach((notificationId, key) => {
        if (key.startsWith(`reminder-${taskId}-`) || key === scheduleKey) {
          notificationIdsToCancel.push(notificationId);
        }
      });

      if (notificationIdsToCancel.length > 0) {
        try {
          await LocalNotifications.cancel({ notifications: notificationIdsToCancel.map(id => ({ id })) });
        } catch (error) {
          console.warn("Failed to cancel local notifications:", error);
        }
      }

      // Remove from tracking map
      this.localNotificationIds.forEach((value, key) => {
        if (key.startsWith(`reminder-${taskId}-`) || key === scheduleKey) {
          this.localNotificationIds.delete(key);
        }
      });
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
      // Schedule multiple reminders: 1 hour, 30 minutes, and 5 minutes before deadline
      const reminderIntervals = [
        { hours: 1, minutes: 0, message: "⏰ Task due in 1 hour" },
        { hours: 0, minutes: 30, message: "⚠️ Task due in 30 minutes" },
        { hours: 0, minutes: 5, message: "🚨 Task due in 5 minutes!" },
      ];

      for (const interval of reminderIntervals) {
        const reminderTime = new Date(deadline.getTime() - (interval.hours * 60 + interval.minutes) * 60 * 1000);
        
        // Only schedule if reminder time is in the future
        if (reminderTime.getTime() > now.getTime()) {
          if (this.isCapacitor && this.permissionGranted) {
            this.scheduleMultipleReminders(task, reminderTime, interval.message);
          } else {
            // Use browser notifications with setTimeout
            const timeUntilReminder = reminderTime.getTime() - now.getTime();
            setTimeout(() => {
              // Check do not disturb before showing notification
              const savedDndStart = localStorage.getItem("dantask-dnd-start");
              const dndStartHour = savedDndStart ? parseInt(savedDndStart, 10) : 23;
              
              if (this.shouldSendNotification(dndStartHour)) {
                this.showNotification(interval.message, {
                  body: `"${task.title}" is due soon. ${interval.hours > 0 ? `Due in ${interval.hours} hour${interval.hours > 1 ? 's' : ''}` : `Due in ${interval.minutes} minutes`}`,
                  tag: `deadline-${task.id}-${interval.hours}-${interval.minutes}`,
                  requireInteraction: interval.minutes <= 5,
                });
              }
            }, timeUntilReminder);
          }
        }
      }

      // Also schedule at deadline if not already past
      if (deadline.getTime() > now.getTime()) {
        const urgency = hoursUntilDue <= 2 ? "URGENT" : hoursUntilDue <= 6 ? "High Priority" : "Reminder";
        const body = hoursUntilDue <= 2 
          ? `⚠️ Due now! Did you complete this?`
          : `Due in ${Math.round(hoursUntilDue)} hours. Have you started this task?`;

        if (this.isCapacitor && this.permissionGranted) {
          this.scheduleLocalNotificationForDeadline(task, deadline, urgency, body);
        } else {
          this.showNotification(`${urgency}: ${task.title}`, {
            body,
            tag: `deadline-${task.id}`,
            requireInteraction: true,
          });
        }
      }
    }
  }

  private async scheduleMultipleReminders(task: Task, reminderTime: Date, message: string) {
    if (!this.isCapacitor || !this.permissionGranted) {
      return;
    }

    // Check if reminder time is in do not disturb period
    const savedDndStart = localStorage.getItem("dantask-dnd-start");
    const dndStartHour = savedDndStart ? parseInt(savedDndStart, 10) : 23;
    const reminderHour = reminderTime.getHours();
    
    // Skip scheduling if reminder time is in DND period
    if (reminderHour >= dndStartHour || reminderHour < this.doNotDisturbEnd) {
      return; // Don't schedule notification during DND period
    }

    try {
      const notificationId = this.nextNotificationId++;
      const reminderKey = `reminder-${task.id}-${reminderTime.getTime()}`;
      this.localNotificationIds.set(reminderKey, notificationId);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: message,
            body: `"${task.title}" is due soon.`,
            id: notificationId,
            schedule: { at: reminderTime },
            sound: "default",
            attachments: [],
            actionTypeId: "",
            extra: {
              taskId: task.id,
              type: "deadline-reminder",
            },
          },
        ],
      });
    } catch (error) {
      console.warn("Failed to schedule reminder notification:", error);
    }
  }

  private async scheduleLocalNotificationForDeadline(task: Task, deadline: Date, urgency: string, body: string) {
    if (!this.isCapacitor || !this.permissionGranted) {
      return;
    }

    // Check if deadline is in do not disturb period
    const savedDndStart = localStorage.getItem("dantask-dnd-start");
    const dndStartHour = savedDndStart ? parseInt(savedDndStart, 10) : 23;
    const deadlineHour = deadline.getHours();
    
    // If deadline is in DND period, move notification to after DND ends
    let notificationTime = deadline;
    if (deadlineHour >= dndStartHour || deadlineHour < this.doNotDisturbEnd) {
      const dndEndTime = new Date(deadline);
      if (deadlineHour >= dndStartHour) {
        // Deadline is in DND, move to next morning
        dndEndTime.setDate(dndEndTime.getDate() + 1);
      }
      dndEndTime.setHours(this.doNotDisturbEnd, 0, 0, 0);
      notificationTime = dndEndTime;
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
            schedule: { at: notificationTime },
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
