import { type Task, type InsertTask, type Availability, type InsertAvailability, type TaskTemplate, type InsertTaskTemplate } from "@shared/schema";
import { tasks, availability, taskTemplates } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { IStorage } from "./storage";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn("DATABASE_URL not set, database features will not work");
}

const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;
const db = pool ? drizzle(pool) : null;

export class PostgresStorage implements IStorage {
  // Task operations
  async getAllTasks(includeArchived: boolean = false): Promise<Task[]> {
    if (!db) return [];
    const result = await db.select().from(tasks);
    if (includeArchived) {
      return result as Task[];
    }
    return result.filter(task => !task.archived) as Task[];
  }

  async getTask(id: string): Promise<Task | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0] as Task | undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(tasks).values(insertTask).returning();
    return result[0] as Task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    if (!db) return undefined;
    const result = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return result[0] as Task | undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    if (!db) return false;
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async archiveTask(id: string): Promise<Task | undefined> {
    if (!db) return undefined;
    const result = await db
      .update(tasks)
      .set({ archived: true })
      .where(eq(tasks.id, id))
      .returning();
    return result[0] as Task | undefined;
  }

  async unarchiveTask(id: string): Promise<Task | undefined> {
    if (!db) return undefined;
    const result = await db
      .update(tasks)
      .set({ archived: false })
      .where(eq(tasks.id, id))
      .returning();
    return result[0] as Task | undefined;
  }

  // Availability operations
  async getAllAvailability(): Promise<Availability[]> {
    if (!db) return [];
    const result = await db.select().from(availability);
    return result as Availability[];
  }

  async getAvailability(id: string): Promise<Availability | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(availability).where(eq(availability.id, id)).limit(1);
    return result[0] as Availability | undefined;
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(availability).values(insertAvailability).returning();
    return result[0] as Availability;
  }

  async updateAvailability(id: string, updates: Partial<Availability>): Promise<Availability | undefined> {
    if (!db) return undefined;
    const result = await db
      .update(availability)
      .set(updates)
      .where(eq(availability.id, id))
      .returning();
    return result[0] as Availability | undefined;
  }

  async deleteAvailability(id: string): Promise<boolean> {
    if (!db) {
      console.log("[DB Storage] Database not configured");
      return false;
    }
    console.log(`[DB Storage] Attempting to delete availability ${id}`);
    const result = await db.delete(availability).where(eq(availability.id, id)).returning();
    console.log(`[DB Storage] Delete result: ${result.length} row(s) deleted`);
    return result.length > 0;
  }

  // Template operations
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    if (!db) return [];
    const result = await db.select().from(taskTemplates);
    return result as TaskTemplate[];
  }

  async getTaskTemplate(id: string): Promise<TaskTemplate | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id)).limit(1);
    return result[0] as TaskTemplate | undefined;
  }

  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(taskTemplates).values(template).returning();
    return result[0] as TaskTemplate;
  }

  async deleteTaskTemplate(id: string): Promise<boolean> {
    if (!db) return false;
    const result = await db.delete(taskTemplates).where(eq(taskTemplates.id, id)).returning();
    return result.length > 0;
  }
}

