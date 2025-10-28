import { Task, PrioritizedTask, ScheduleResponse } from "@shared/schema";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free models to use
const FREE_MODELS = [
  "deepseek/deepseek-chat",
  "google/gemini-2.0-flash-001:free",
];

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenRouter(messages: OpenRouterMessage[], model: string = FREE_MODELS[0]): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dantask.replit.app",
      "X-Title": "DanTask",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
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
  if (tasks.length === 0 || availability.length === 0) {
    return { schedule: [] };
  }

  const activeTasks = tasks.filter(t => !t.completed && t.estimatedDuration);
  if (activeTasks.length === 0) {
    return { schedule: [] };
  }

  const taskDescriptions = activeTasks.map((task, index) => {
    return `Task ${index + 1}:
- ID: ${task.id}
- Title: ${task.title}
- Priority: ${task.priority}
- AI Priority: ${task.aiPriority || "Not set"}
- Estimated Duration: ${task.estimatedDuration} hours
- Deadline: ${task.deadline ? new Date(task.deadline).toISOString() : "No deadline"}`;
  }).join("\n\n");

  const availabilityDescriptions = availability.map((avail, index) => {
    return `Slot ${index + 1}:
- Date: ${avail.date.toISOString()}
- Available Hours: ${avail.availableHours}
- Time Range: ${avail.startTime || "Flexible"} - ${avail.endTime || "Flexible"}`;
  }).join("\n\n");

  const systemPrompt = `You are an AI scheduling assistant for DanTask. Create an optimized work schedule that:

1. Respects deadlines and priorities
2. Fits tasks into available time slots
3. Considers task duration and user availability
4. Suggests optimal start times for focused work
5. Avoids overloading any single day

Respond with a JSON object containing a "schedule" array. Each item should have:
- taskId: the task ID
- scheduledStart: ISO 8601 datetime string
- scheduledEnd: ISO 8601 datetime string
- reasoning: brief explanation (1 sentence)

Be realistic and practical. It's okay if not all tasks fit - prioritize the most important ones.`;

  const userPrompt = `Create an optimized schedule for these tasks:

${taskDescriptions}

Available time slots:

${availabilityDescriptions}

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
    
    // Try to find JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const scheduleResponse = JSON.parse(jsonText) as ScheduleResponse;
    return scheduleResponse;
  } catch (error) {
    console.error("Error generating schedule:", error);
    
    // Fallback: simple scheduling
    const schedule: ScheduleResponse["schedule"] = [];
    let currentAvailIndex = 0;
    
    for (const task of activeTasks.slice(0, 3)) {
      if (currentAvailIndex >= availability.length) break;
      
      const avail = availability[currentAvailIndex];
      const startTime = avail.startTime || "09:00";
      const [hours, minutes] = startTime.split(':').map(Number);
      
      const start = new Date(avail.date);
      start.setHours(hours, minutes, 0, 0);
      
      const end = new Date(start);
      end.setHours(start.getHours() + (task.estimatedDuration || 1));
      
      schedule.push({
        taskId: task.id,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        reasoning: `Scheduled based on ${task.priority} priority and available time.`,
      });
      
      currentAvailIndex++;
    }
    
    return { schedule };
  }
}
