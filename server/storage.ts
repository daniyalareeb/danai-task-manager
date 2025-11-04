import { type Task, type InsertTask, type Availability, type InsertAvailability, type TaskTemplate, type InsertTaskTemplate } from "@shared/schema";
import { randomUUID } from "crypto";
import { PostgresStorage } from "./db-storage";

export interface IStorage {
  // Task operations
  getAllTasks(includeArchived?: boolean): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  archiveTask(id: string): Promise<Task | undefined>;
  unarchiveTask(id: string): Promise<Task | undefined>;

  // Availability operations
  getAllAvailability(): Promise<Availability[]>;
  getAvailability(id: string): Promise<Availability | undefined>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: string, updates: Partial<Availability>): Promise<Availability | undefined>;
  deleteAvailability(id: string): Promise<boolean>;

  // Template operations
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplate(id: string): Promise<TaskTemplate | undefined>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  deleteTaskTemplate(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private availability: Map<string, Availability>;

  constructor() {
    this.tasks = new Map();
    this.availability = new Map();
  }

  // Task operations
  async getAllTasks(includeArchived: boolean = false): Promise<Task[]> {
    const allTasks = Array.from(this.tasks.values());
    if (includeArchived) {
      return allTasks;
    }
    return allTasks.filter(task => !task.archived);
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      description: insertTask.description ?? null,
      createdAt: now,
      completedAt: insertTask.completed ? now : null,
      aiPriority: null,
      aiReasoning: null,
      recurringPattern: insertTask.recurringPattern ?? null,
      parentTaskId: insertTask.parentTaskId ?? null,
      nextRecurrenceDate: insertTask.nextRecurrenceDate ?? null,
      actualDuration: insertTask.actualDuration ?? null,
      archived: insertTask.archived ?? false,
      category: insertTask.category ?? null,
      tags: insertTask.tags ?? null,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      ...updates,
      completedAt: updates.completed && !task.completed ? new Date() : task.completedAt,
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async archiveTask(id: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const archivedTask: Task = { ...task, archived: true };
    this.tasks.set(id, archivedTask);
    return archivedTask;
  }

  async unarchiveTask(id: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const unarchivedTask: Task = { ...task, archived: false };
    this.tasks.set(id, unarchivedTask);
    return unarchivedTask;
  }

  // Availability operations
  async getAllAvailability(): Promise<Availability[]> {
    return Array.from(this.availability.values());
  }

  async getAvailability(id: string): Promise<Availability | undefined> {
    return this.availability.get(id);
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const id = randomUUID();
    const availability: Availability = {
      ...insertAvailability,
      id,
      startTime: insertAvailability.startTime ?? null,
      endTime: insertAvailability.endTime ?? null,
      createdAt: new Date(),
    };
    this.availability.set(id, availability);
    return availability;
  }

  async updateAvailability(id: string, updates: Partial<Availability>): Promise<Availability | undefined> {
    const availability = this.availability.get(id);
    if (!availability) return undefined;

    const updatedAvailability: Availability = {
      ...availability,
      ...updates,
    };
    this.availability.set(id, updatedAvailability);
    return updatedAvailability;
  }

  async deleteAvailability(id: string): Promise<boolean> {
    console.log(`[MemStorage] Attempting to delete availability ${id}`);
    const deleted = this.availability.delete(id);
    console.log(`[MemStorage] Delete result: ${deleted}, remaining: ${this.availability.size}`);
    return deleted;
  }

  // Template operations
  private templates: Map<string, TaskTemplate> = new Map();

  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getTaskTemplate(id: string): Promise<TaskTemplate | undefined> {
    return this.templates.get(id);
  }

  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const id = randomUUID();
    const taskTemplate: TaskTemplate = {
      ...template,
      id,
      description: template.description ?? null,
      category: template.category ?? null,
      createdAt: new Date(),
    };
    this.templates.set(id, taskTemplate);
    return taskTemplate;
  }

  async deleteTaskTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }
}

/**
 * Storage Implementation Selection
 * 
 * Automatically chooses between:
 * - PostgresStorage: Uses PostgreSQL database (production)
 * - MemStorage: In-memory storage (development/fallback)
 * 
 * Selection is based on DATABASE_URL environment variable.
 * If DATABASE_URL is not set, falls back to in-memory storage.
 */

// Choose storage implementation based on environment
const DATABASE_URL = process.env.DATABASE_URL;

export const storage = DATABASE_URL ? new PostgresStorage() : new MemStorage();

// Log which storage is being used
if (DATABASE_URL) {
  console.log("📦 Using PostgreSQL database storage");
} else {
  console.log("💾 Using in-memory storage (data will reset on restart)");
  console.warn("⚠️  Warning: Set DATABASE_URL for persistent storage");
}
