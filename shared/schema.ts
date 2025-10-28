import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  estimatedDuration: integer("estimated_duration"),
  deadline: timestamp("deadline"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  aiPriority: integer("ai_priority"),
  aiReasoning: text("ai_reasoning"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  availableHours: integer("available_hours").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  aiPriority: true,
  aiReasoning: true,
}).extend({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["pending", "scheduled", "in-progress", "completed"]).default("pending"),
  estimatedDuration: z.number().min(1).optional(),
  deadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
  scheduledStart: z.string().optional().transform(val => val ? new Date(val) : undefined),
  scheduledEnd: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completed: z.boolean().default(false),
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform(val => new Date(val)),
  availableHours: z.number().min(1).max(24),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;

// AI Request/Response types
export interface PrioritizeTasksRequest {
  tasks: Task[];
}

export interface PrioritizedTask {
  taskId: string;
  priority: number;
  reasoning: string;
  suggestedTimeSlot?: {
    start: string;
    end: string;
  };
}

export interface PrioritizeTasksResponse {
  prioritizedTasks: PrioritizedTask[];
  focusTask?: {
    taskId: string;
    reasoning: string;
  };
}

export interface ScheduleRequest {
  tasks: Task[];
  availability: Availability[];
}

export interface ScheduleResponse {
  schedule: Array<{
    taskId: string;
    scheduledStart: string;
    scheduledEnd: string;
    reasoning: string;
  }>;
}
