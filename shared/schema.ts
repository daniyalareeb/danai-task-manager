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
  // New fields for enhanced features
  recurringPattern: text("recurring_pattern"), // "daily", "weekly", "monthly", or null
  parentTaskId: varchar("parent_task_id"), // Reference to parent recurring task
  nextRecurrenceDate: timestamp("next_recurrence_date"), // When next instance should be created
  actualDuration: integer("actual_duration"), // Actual time spent in minutes
  archived: boolean("archived").notNull().default(false), // Archive status
  category: text("category"), // Task category/tag
  tags: text("tags"), // Comma-separated tags (stored as text, parsed as array)
});

export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  availableHours: integer("available_hours").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Template name
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  estimatedDuration: integer("estimated_duration"),
  category: text("category"),
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
  estimatedDuration: z.number().min(0.5).optional(),
  deadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
  scheduledStart: z.string().optional().transform(val => val ? new Date(val) : undefined),
  scheduledEnd: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completed: z.boolean().default(false),
  recurringPattern: z.enum(["daily", "weekly", "monthly"]).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  nextRecurrenceDate: z.string().optional().transform(val => val ? new Date(val) : undefined).nullable(),
  actualDuration: z.number().min(0).optional().nullable(),
  archived: z.boolean().default(false),
  category: z.string().optional().nullable(),
  tags: z.string().optional().nullable(), // Comma-separated string, will be parsed as array
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

// Partial update schemas for PATCH routes
export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["pending", "scheduled", "in-progress", "completed"]).optional(),
  estimatedDuration: z.number().min(0.5).optional(),
  deadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
  scheduledStart: z.string().optional().transform(val => val ? new Date(val) : undefined),
  scheduledEnd: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completed: z.boolean().optional(),
  aiPriority: z.number().optional(),
  aiReasoning: z.string().optional(),
  recurringPattern: z.enum(["daily", "weekly", "monthly"]).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  nextRecurrenceDate: z.string().optional().transform(val => val ? new Date(val) : undefined).nullable(),
  actualDuration: z.number().min(0).optional().nullable(),
  archived: z.boolean().optional(),
  category: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
}).strict(); // Reject unknown fields

export const updateAvailabilitySchema = z.object({
  date: z.string().transform(val => new Date(val)).optional(),
  availableHours: z.number().min(1).max(24).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
}).strict(); // Reject unknown fields

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Template name is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  estimatedDuration: z.number().min(0.5).optional(),
  category: z.string().optional().nullable(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type UpdateAvailability = z.infer<typeof updateAvailabilitySchema>;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;

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
