import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type InsertTask, type TaskTemplate } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskFormProps {
  onSubmit: (data: InsertTask) => void;
  defaultValues?: Partial<InsertTask>;
  isLoading?: boolean;
  onSaveAsTemplate?: (data: InsertTask) => void;
  templateName?: string;
  onTemplateNameChange?: (name: string) => void;
}

export function TaskForm({ onSubmit, defaultValues, isLoading, onSaveAsTemplate, templateName, onTemplateNameChange }: TaskFormProps) {
  // Query templates but don't fail if endpoint doesn't exist
  // Disabled since templates page was removed
  const { data: templates = [] } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      // This won't execute since enabled is false, but added for type safety
      const response = await apiRequest("GET", "/api/templates");
      return await response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: false, // Disable templates query since we removed templates page
  });

  const form = useForm<InsertTask & { saveAsTemplate?: boolean; templateId?: string }>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      priority: defaultValues?.priority || "medium",
      status: defaultValues?.status || "pending",
      estimatedDuration: defaultValues?.estimatedDuration || undefined,
      deadline: defaultValues?.deadline ? new Date(defaultValues.deadline).toISOString().split('T')[0] as any : undefined,
      completed: defaultValues?.completed || false,
      recurringPattern: defaultValues?.recurringPattern || undefined,
      category: defaultValues?.category || undefined,
      tags: defaultValues?.tags || undefined,
    },
  });

  const selectedTemplateId = form.watch("templateId");

  // Load template when selected
  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        form.reset({
          title: template.title,
          description: template.description || "",
          priority: template.priority as "low" | "medium" | "high" | "urgent",
          estimatedDuration: template.estimatedDuration || undefined,
          category: template.category || undefined,
          status: "pending",
          completed: false,
          recurringPattern: undefined,
          tags: undefined,
        });
      }
    }
  }, [selectedTemplateId, templates, form]);

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl md:text-2xl">
          {defaultValues ? "Edit Task" : "Create New Task"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6 pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
            const { saveAsTemplate, templateId, templateName, ...taskData } = data;
            if (saveAsTemplate && onSaveAsTemplate) {
              onSaveAsTemplate(taskData as InsertTask);
            }
            onSubmit(taskData as InsertTask);
          })} className="space-y-6">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What needs to be done?"
                      {...field}
                      data-testid="input-task-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this task..."
                      className="resize-none h-24"
                      {...field}
                      data-testid="input-task-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-task-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        placeholder="2"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ""}
                        data-testid="input-task-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? (typeof field.value === 'string' ? field.value : new Date(field.value as any).toISOString().split('T')[0]) : ""}
                      data-testid="input-task-deadline"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!defaultValues && templates.length > 0 && (
              <FormField
                control={form.control as any}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create from Template (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="recurringPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Pattern (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Work, Personal"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional, comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="tag1, tag2, tag3"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!defaultValues && onSaveAsTemplate && (
              <>
                <FormField
                  control={form.control as any}
                  name="saveAsTemplate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Save as Template</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                {form.watch("saveAsTemplate") && (
                  <FormField
                    control={form.control as any}
                    name="templateName"
                    render={() => (
                      <FormItem>
                        <FormLabel>Template Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Daily Standup Template"
                            value={templateName || ""}
                            onChange={(e) => onTemplateNameChange?.(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-task">
              {isLoading ? "Saving..." : defaultValues ? "Update Task" : "Create Task"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
