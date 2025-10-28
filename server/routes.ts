import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { prioritizeTasks, generateSchedule } from "./ai";
import { insertTaskSchema, insertAvailabilitySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Task routes
  app.get("/api/tasks", async (_req, res) => {
    try {
      const tasks = await storage.getAllTasks();
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
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
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
      const availability = await storage.getAllAvailability();
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

  // Schedule generation
  app.post("/api/schedule/generate", async (_req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const availability = await storage.getAllAvailability();

      const mappedAvailability = availability.map(a => ({
        date: a.date,
        availableHours: a.availableHours,
        startTime: a.startTime ?? undefined,
        endTime: a.endTime ?? undefined,
      }));

      const scheduleResponse = await generateSchedule(tasks, mappedAvailability);

      // Update tasks with schedule
      for (const scheduleItem of scheduleResponse.schedule) {
        await storage.updateTask(scheduleItem.taskId, {
          scheduledStart: new Date(scheduleItem.scheduledStart),
          scheduledEnd: new Date(scheduleItem.scheduledEnd),
          status: "scheduled",
        });
      }

      const updatedTasks = await storage.getAllTasks();
      res.json({ schedule: scheduleResponse.schedule, tasks: updatedTasks });
    } catch (error) {
      console.error("Error generating schedule:", error);
      res.status(500).json({ error: "Failed to generate schedule" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
