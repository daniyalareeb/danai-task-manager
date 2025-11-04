/**
 * API Routes Configuration
 * 
 * Defines all REST API endpoints:
 * - Task CRUD operations (GET, POST, PATCH, DELETE)
 * - Availability management
 * - AI-powered prioritization and scheduling
 * 
 * All routes include:
 * - Input validation using Zod schemas
 * - Error handling with appropriate HTTP status codes
 * - Consistent JSON response format
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { prioritizeTasks, generateSchedule } from "./ai";
import { insertTaskSchema, insertAvailabilitySchema, updateTaskSchema, updateAvailabilitySchema, insertTaskTemplateSchema } from "@shared/schema";
import { z } from "zod";

/**
 * Registers all API routes with the Express app
 * @param app Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const includeArchived = req.query.archived === "true";
      const tasks = await storage.getAllTasks(includeArchived);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      // Validate partial update data
      const validatedData = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if task was just completed and has recurring pattern
      if (validatedData.completed === true && task.recurringPattern && !task.parentTaskId) {
        // Calculate next occurrence date
        const now = new Date();
        let nextDate = new Date();
        
        if (task.recurringPattern === "daily") {
          nextDate.setDate(now.getDate() + 1);
        } else if (task.recurringPattern === "weekly") {
          nextDate.setDate(now.getDate() + 7);
        } else if (task.recurringPattern === "monthly") {
          nextDate.setMonth(now.getMonth() + 1);
        }

        // Create new task instance
        const newTask = await storage.createTask({
          title: task.title,
          description: task.description ?? undefined,
          priority: task.priority as "low" | "medium" | "high" | "urgent",
          status: "pending",
          estimatedDuration: task.estimatedDuration ?? undefined,
          deadline: task.deadline ? new Date(task.deadline).toISOString() : undefined,
          completed: false,
          recurringPattern: task.recurringPattern,
          parentTaskId: task.id,
          nextRecurrenceDate: nextDate.toISOString(),
          category: task.category ?? undefined,
          tags: task.tags ?? undefined,
        });

        console.log(`[Recurring] Created new instance for recurring task "${task.title}"`);
      }

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task update data", details: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Archive/Unarchive endpoints
  app.patch("/api/tasks/:id/archive", async (req, res) => {
    try {
      const task = await storage.archiveTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error archiving task:", error);
      res.status(500).json({ error: "Failed to archive task" });
    }
  });

  app.patch("/api/tasks/:id/unarchive", async (req, res) => {
    try {
      const task = await storage.unarchiveTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error unarchiving task:", error);
      res.status(500).json({ error: "Failed to unarchive task" });
    }
  });

  // Timer endpoint
  app.patch("/api/tasks/:id/timer", async (req, res) => {
    try {
      const { action, minutes } = req.body; // action: "start" | "stop" | "update", minutes: number
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      let actualDuration = task.actualDuration ?? 0;
      if (action === "update" && typeof minutes === "number") {
        actualDuration = minutes;
      } else if (action === "stop" && typeof minutes === "number") {
        actualDuration = (task.actualDuration ?? 0) + minutes;
      }

      const updatedTask = await storage.updateTask(req.params.id, { actualDuration });
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating timer:", error);
      res.status(500).json({ error: "Failed to update timer" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // AI Prioritization
  app.post("/api/tasks/prioritize", async (_req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const prioritizedTasks = await prioritizeTasks(tasks);

      // Update tasks with AI priorities
      for (const pt of prioritizedTasks) {
        await storage.updateTask(pt.taskId, {
          aiPriority: pt.priority,
          aiReasoning: pt.reasoning,
        });
      }

      const updatedTasks = await storage.getAllTasks();
      res.json({ prioritizedTasks, tasks: updatedTasks });
    } catch (error) {
      console.error("Error prioritizing tasks:", error);
      res.status(500).json({ error: "Failed to prioritize tasks" });
    }
  });

  // Availability routes
  app.get("/api/availability", async (_req, res) => {
    try {
      // Prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const availability = await storage.getAllAvailability();
      console.log(`[GET] Returning ${availability.length} availability slots`);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  app.post("/api/availability", async (req, res) => {
    try {
      const validatedData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.createAvailability(validatedData);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid availability data", details: error.errors });
      }
      console.error("Error creating availability:", error);
      res.status(500).json({ error: "Failed to create availability" });
    }
  });

  app.put("/api/availability/:id", async (req, res) => {
    try {
      // Validate partial update data
      const validatedData = updateAvailabilitySchema.parse(req.body);
      const availability = await storage.updateAvailability(req.params.id, validatedData);
      if (!availability) {
        return res.status(404).json({ error: "Availability not found" });
      }
      res.json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid availability update data", details: error.errors });
      }
      console.error("Error updating availability:", error);
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.delete("/api/availability/:id", async (req, res) => {
    try {
      console.log(`[DELETE] Deleting availability ${req.params.id}`);
      const deleted = await storage.deleteAvailability(req.params.id);
      console.log(`[DELETE] Result: ${deleted}`);
      
      // Get remaining availability count
      const remaining = await storage.getAllAvailability();
      console.log(`[DELETE] Remaining availability slots: ${remaining.length}`);
      
      if (!deleted) {
        return res.status(404).json({ error: "Availability not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ error: "Failed to delete availability" });
    }
  });

  // Template routes
  app.get("/api/templates", async (_req, res) => {
    try {
      const templates = await storage.getTaskTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertTaskTemplateSchema.parse(req.body);
      const template = await storage.createTaskTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid template data", details: error.errors });
      }
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTaskTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Create task from template
  app.post("/api/tasks/from-template/:templateId", async (req, res) => {
    try {
      const template = await storage.getTaskTemplate(req.params.templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const task = await storage.createTask({
        title: template.title,
        description: template.description ?? undefined,
        priority: template.priority as "low" | "medium" | "high" | "urgent",
        status: "pending",
        estimatedDuration: template.estimatedDuration ?? undefined,
        category: template.category ?? undefined,
        completed: false,
      });

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task from template:", error);
      res.status(500).json({ error: "Failed to create task from template" });
    }
  });

  // Automatic daily carryover
  app.post("/api/tasks/auto-carryover", async (_req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let carryoverCount = 0;

      for (const task of tasks) {
        if (!task.completed && !task.archived && task.scheduledStart) {
          const scheduledTime = new Date(task.scheduledStart);
          const scheduledDate = new Date(scheduledTime.getFullYear(), scheduledTime.getMonth(), scheduledTime.getDate());
          
          // Check if task is scheduled for today or a past date
          if (scheduledDate.getTime() <= today.getTime()) {
            // Check if scheduled time has passed (more than 1 hour ago)
            if (scheduledTime.getTime() < now.getTime() - 3600000) {
              // Reschedule for tomorrow (same time)
              const tomorrow = new Date(scheduledTime);
              tomorrow.setDate(tomorrow.getDate() + 1);
              
              // Calculate new end time if scheduledEnd exists
              let newEndTime: Date | null = null;
              if (task.scheduledEnd) {
                const originalEnd = new Date(task.scheduledEnd);
                const duration = originalEnd.getTime() - scheduledTime.getTime();
                newEndTime = new Date(tomorrow.getTime() + duration);
              }

              await storage.updateTask(task.id, {
                scheduledStart: tomorrow,
                scheduledEnd: newEndTime,
                status: "scheduled",
              });

              carryoverCount++;
              console.log(`[Auto-Carryover] Rescheduled task "${task.title}" from ${scheduledTime.toISOString()} to ${tomorrow.toISOString()}`);
            }
          }
        }
      }

      res.json({
        carryoverCount,
        message: carryoverCount > 0 
          ? `${carryoverCount} task${carryoverCount > 1 ? 's' : ''} automatically rescheduled for tomorrow`
          : "No tasks needed carryover",
      });
    } catch (error) {
      console.error("Error in auto-carryover:", error);
      res.status(500).json({ error: "Failed to perform auto-carryover" });
    }
  });

  // Schedule generation
  app.post("/api/schedule/generate", async (_req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const availability = await storage.getAllAvailability();
      
      // Clear scheduled times for incomplete tasks whose scheduled time has passed (carryover)
      const now = new Date();
      let carryoverCount = 0;
      for (const task of tasks) {
        if (!task.completed && task.scheduledStart) {
          const scheduledTime = new Date(task.scheduledStart);
          // If scheduled time has passed (more than 1 hour ago), clear the schedule
          if (scheduledTime.getTime() < now.getTime() - 3600000) { // 1 hour buffer
            await storage.updateTask(task.id, {
              scheduledStart: null,
              scheduledEnd: null,
              status: "pending", // Reset to pending so it can be rescheduled
            });
            carryoverCount++;
            console.log(`[Schedule] Cleared old schedule for task "${task.title}" (carryover)`);
          }
        }
      }

      const mappedAvailability = availability.map(a => ({
        date: a.date,
        availableHours: a.availableHours,
        startTime: a.startTime ?? undefined,
        endTime: a.endTime ?? undefined,
      }));

      // Get updated tasks after clearing carryover
      const updatedTasksForSchedule = await storage.getAllTasks();
      const scheduleResponse = await generateSchedule(updatedTasksForSchedule, mappedAvailability);

      // Update tasks with new schedule
      for (const scheduleItem of scheduleResponse.schedule) {
        await storage.updateTask(scheduleItem.taskId, {
          scheduledStart: new Date(scheduleItem.scheduledStart),
          scheduledEnd: new Date(scheduleItem.scheduledEnd),
          status: "scheduled",
        });
      }

      const updatedTasks = await storage.getAllTasks();
      res.json({ 
        schedule: scheduleResponse.schedule, 
        tasks: updatedTasks,
        carryoverCount, // Include count of tasks that were carried over
      });
    } catch (error) {
      console.error("Error generating schedule:", error);
      res.status(500).json({ error: "Failed to generate schedule" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
