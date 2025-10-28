import { format } from "date-fns";
import { Task, PrioritizedTask, ScheduleResponse } from "@shared/schema";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free models to use (always use :free suffix for free tier)
const FREE_MODELS = [
  "deepseek/deepseek-chat:free",
  "google/gemini-2.0-flash-exp:free", 
  "meta-llama/llama-3.2-3b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
];

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenRouter(messages: OpenRouterMessage[], model: string = FREE_MODELS[0]): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured. Get your free key from https://openrouter.ai/");
  }

  // Try multiple free models as fallback
  for (const freeModel of FREE_MODELS) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://dantask.replit.app",
          "X-Title": "DanTask",
        },
        body: JSON.stringify({
          model: freeModel,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`OpenRouter API error with ${freeModel}:`, errorText);
        continue; // Try next model
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.warn(`Error with model ${freeModel}:`, error);
      continue; // Try next model
    }
  }

  throw new Error("All free models failed. Please check your OPENROUTER_API_KEY");
}

export async function prioritizeTasks(tasks: Task[]): Promise<PrioritizedTask[]> {
  if (tasks.length === 0) {
    return [];
  }

  const activeTasks = tasks.filter(t => !t.completed);
  if (activeTasks.length === 0) {
    return [];
  }

  const taskDescriptions = activeTasks.map((task, index) => {
    return `Task ${index + 1}:
- ID: ${task.id}
- Title: ${task.title}
- Description: ${task.description || "No description"}
- Priority: ${task.priority}
- Estimated Duration: ${task.estimatedDuration || "Not specified"} hours
- Deadline: ${task.deadline ? new Date(task.deadline).toISOString() : "No deadline"}
- Current Status: ${task.status}`;
  }).join("\n\n");

  const systemPrompt = `You are an AI task prioritization assistant for DanTask. Your role is to analyze tasks and help users focus on what matters most.

Consider these factors when prioritizing:
1. Urgency (deadlines and time-sensitivity)
2. Importance (impact and consequences)
3. User-set priority levels
4. Estimated duration (quick wins vs. long tasks)
5. Dependencies and logical ordering

Respond with a JSON array of prioritized tasks. Each task should have:
- taskId: the task ID
- priority: a number from 1 (highest) to N (lowest)
- reasoning: a brief, actionable explanation (1-2 sentences)

Be concise and practical. Focus on helping the user take action.`;

  const userPrompt = `Please prioritize these tasks and explain your reasoning:

${taskDescriptions}

Return ONLY valid JSON with no additional text or markdown formatting.`;

  try {
    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Try to extract JSON from the response
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    // Try to find JSON array in the response
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const prioritized = JSON.parse(jsonText) as PrioritizedTask[];
    return prioritized;
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    
    // Fallback: basic priority-based sorting
    return activeTasks.map((task, index) => {
      const priorityOrder: { [key: string]: number } = { urgent: 1, high: 2, medium: 3, low: 4 };
      return {
        taskId: task.id,
        priority: index + 1,
        reasoning: `Prioritized based on ${task.priority} priority level${task.deadline ? " and deadline" : ""}.`,
      };
    }).sort((a, b) => {
      const taskA = activeTasks.find(t => t.id === a.taskId)!;
      const taskB = activeTasks.find(t => t.id === b.taskId)!;
      const priorityOrder: { [key: string]: number } = { urgent: 1, high: 2, medium: 3, low: 4 };
      return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
    }).map((item, index) => ({ ...item, priority: index + 1 }));
  }
}

export async function generateSchedule(
  tasks: Task[],
  availability: Array<{ date: Date; availableHours: number; startTime?: string; endTime?: string }>
): Promise<ScheduleResponse> {
  console.log(`[AI] generateSchedule called with ${tasks.length} tasks, ${availability.length} availability slots`);
  
  if (tasks.length === 0 || availability.length === 0) {
    console.log("[AI] No tasks or availability - returning empty schedule");
    return { schedule: [] };
  }

  const activeTasks = tasks.filter(t => !t.completed && t.estimatedDuration);
  console.log(`[AI] Found ${activeTasks.length} active tasks with duration`);
  
  if (activeTasks.length === 0) {
    console.log("[AI] No active tasks with duration - returning empty schedule");
    return { schedule: [] };
  }

  // Sort tasks by priority (AI priority first, then user priority, then deadline)
  const sortedTasks = [...activeTasks].sort((a, b) => {
    // First by AI priority (if available)
    if (a.aiPriority && b.aiPriority) {
      if (a.aiPriority !== b.aiPriority) return a.aiPriority - b.aiPriority;
    }
    // Then by user-set priority
    const priorityOrder: { [key: string]: number } = { urgent: 1, high: 2, medium: 3, low: 4 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    if (aPriority !== bPriority) return aPriority - bPriority;
    // Finally by deadline
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return 0;
  });

  const taskDescriptions = sortedTasks.map((task, index) => {
    return `Task ${index + 1} (Priority: ${index + 1}):
- ID: ${task.id}
- Title: ${task.title}
- Priority: ${task.priority}
- AI Priority Score: ${task.aiPriority || "Not set"}
- Estimated Duration: ${task.estimatedDuration} hours
- Deadline: ${task.deadline ? new Date(task.deadline).toISOString() : "No deadline"}`;
  }).join("\n\n");

  const availabilityDescriptions = availability.map((avail, index) => {
    const dateStr = format(avail.date, "yyyy-MM-dd");
    return `Slot ${index + 1}:
- Date: ${dateStr}
- Time Window: ${avail.startTime || "09:00"} to ${avail.endTime || "18:00"}
- Total Hours Available: ${avail.availableHours}`;
  }).join("\n\n");

  const systemPrompt = `You are an AI scheduling assistant for DanTask. Your job is to create a smart schedule by:

1. Starting with the highest priority tasks (Task 1, Task 2, etc.)
2. Matching task durations to available time windows
3. Respecting specific time slots (startTime to endTime) exactly
4. Putting urgent tasks and tasks with upcoming deadlines first
5. Spacing out work to avoid burnout (buffer time between tasks)
6. Ensuring tasks fit within their assigned time windows

IMPORTANT: When scheduling, you MUST:
- Use the exact date from the availability slot
- Schedule tasks between startTime and endTime only
- Ensure task starts early enough to finish before endTime
- Add 15-30 min buffer between tasks when possible

Return a JSON object with a "schedule" array. Each item needs:
- taskId: the task ID
- scheduledStart: ISO 8601 datetime string (e.g., "2025-01-15T09:00:00Z")
- scheduledEnd: ISO 8601 datetime string (start + duration)
- reasoning: 1-sentence explanation

Only schedule tasks that can realistically fit. It's okay if lower priority tasks don't get scheduled.`;

  const userPrompt = `Schedule these tasks (in priority order):

${taskDescriptions}

Available time windows:

${availabilityDescriptions}

Return ONLY valid JSON like: {"schedule": [{"taskId": "...", "scheduledStart": "...", "scheduledEnd": "...", "reasoning": "..."}]}`;

  try {
    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Try to extract JSON from the response
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    // Try to find JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const scheduleResponse = JSON.parse(jsonText) as ScheduleResponse;
    return scheduleResponse;
  } catch (error) {
    console.error("Error generating schedule:", error);
    console.log("[AI] Falling back to simple scheduling");
    
    // Fallback: simple scheduling
    const schedule: ScheduleResponse["schedule"] = [];
    let currentAvailIndex = 0;
    
    console.log(`[AI] Fallback: Scheduling ${Math.min(activeTasks.length, availability.length)} tasks`);
    
    for (const task of activeTasks.slice(0, 3)) {
      if (currentAvailIndex >= availability.length) {
        console.log(`[AI] No more availability slots at index ${currentAvailIndex}`);
        break;
      }
      
      const avail = availability[currentAvailIndex];
      const startTime = avail.startTime || "09:00";
      const [hours, minutes] = startTime.split(':').map(Number);
      
      const start = new Date(avail.date);
      start.setHours(hours, minutes, 0, 0);
      
      const end = new Date(start);
      end.setHours(start.getHours() + (task.estimatedDuration || 1));
      
      console.log(`[AI] Scheduling task ${task.title} on ${start.toISOString()} to ${end.toISOString()}`);
      
      schedule.push({
        taskId: task.id,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        reasoning: `Scheduled based on ${task.priority} priority and available time.`,
      });
      
      currentAvailIndex++;
    }
    
    console.log(`[AI] Fallback generated ${schedule.length} scheduled tasks`);
    return { schedule };
  }
}
