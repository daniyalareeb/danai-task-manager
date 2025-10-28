import { type Task, type InsertTask, type Availability, type InsertAvailability } from "@shared/schema";
import { randomUUID } from "crypto";
import { PostgresStorage } from "./db-storage";

export interface IStorage {
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Availability operations
  getAllAvailability(): Promise<Availability[]>;
  getAvailability(id: string): Promise<Availability | undefined>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: string, updates: Partial<Availability>): Promise<Availability | undefined>;
  deleteAvailability(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private availability: Map<string, Availability>;

  constructor() {
    this.tasks = new Map();
    this.availability = new Map();
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
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
}

// Choose storage implementation based on environment
const DATABASE_URL = process.env.DATABASE_URL;

export const storage = DATABASE_URL ? new PostgresStorage() : new MemStorage();

// Log which storage is being used
if (DATABASE_URL) {
  console.log("📦 Using PostgreSQL database storage");
} else {
  console.log("💾 Using in-memory storage (data will reset on restart)");
}
