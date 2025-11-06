import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calendar, Edit, Save, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Availability } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TimeSlot {
  id?: string;
  date: Date;
  startTime: string;
  endTime: string;
}

export function CalendarAvailability() {
  const { toast } = useToast();
  const [localSlots, setLocalSlots] = useState<TimeSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ startTime: string; endTime: string } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newSlotTime, setNewSlotTime] = useState({ startTime: "09:00", endTime: "17:00" });

  const { data: savedAvailability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/availability/${id}`, undefined);
    },
    onSuccess: async () => {
      // Force a hard cache refresh
      await queryClient.removeQueries({ queryKey: ["/api/availability"] });
      await queryClient.refetchQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Deleted",
        description: "Availability slot removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete slot.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, startTime, endTime }: { id: string; startTime: string; endTime: string }) => {
      const availability = savedAvailability.find(a => a.id === id);
      if (!availability) return;
      
      return apiRequest("PUT", `/api/availability/${id}`, {
        ...availability,
        startTime,
        endTime,
        availableHours: calculateHours(startTime, endTime),
      });
    },
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ["/api/availability"] });
      await queryClient.refetchQueries({ queryKey: ["/api/availability"] });
      setEditingSlot(null);
      setEditingValues(null);
      toast({
        title: "Updated",
        description: "Availability slot updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update slot.",
        variant: "destructive",
      });
    },
  });

  const handleAddSlot = async () => {
    if (!selectedDate) return;
    
    try {
      await apiRequest("POST", "/api/availability", {
        date: selectedDate,
        availableHours: calculateHours(newSlotTime.startTime, newSlotTime.endTime),
        startTime: newSlotTime.startTime,
        endTime: newSlotTime.endTime,
      });
      await queryClient.removeQueries({ queryKey: ["/api/availability"] });
      await queryClient.refetchQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Added!",
        description: "New time slot added.",
      });
      setSelectedDate(null);
      setNewSlotTime({ startTime: "09:00", endTime: "17:00" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add time slot.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAll = async () => {
    if (savedAvailability.length === 0) return;
    
    try {
      const deletionPromises = savedAvailability.map(avail => 
        apiRequest("DELETE", `/api/availability/${avail.id}`, undefined).catch(err => {
          console.warn(`Failed to delete slot ${avail.id}:`, err);
          return null;
        })
      );
      
      await Promise.all(deletionPromises);
      
      // Force a hard refresh of the query cache
      await queryClient.removeQueries({ queryKey: ["/api/availability"] });
      await queryClient.refetchQueries({ queryKey: ["/api/availability"] });
      
      toast({
        title: "Cleared!",
        description: `Removed ${savedAvailability.length} availability slot${savedAvailability.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear availability.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (slotId: string) => {
    deleteMutation.mutate(slotId);
  };

  // Get all days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get slots for a specific date
  const getSlotsForDate = (date: Date) => {
    return savedAvailability.filter(avail => isSameDay(new Date(avail.date), date));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Get month name
  const monthName = format(currentMonth, "MMMM yyyy");
  const today = new Date();

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Calendar Availability
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Click any date to add time slots. Add as many days as you want!
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {savedAvailability.length} slot{savedAvailability.length !== 1 ? 's' : ''} saved
              </Badge>
              {savedAvailability.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="h-7 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">{monthName}</h3>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Pad start of month */}
            {[...Array(startOfMonth(currentMonth).getDay())].map((_, i) => (
              <div key={`empty-start-${i}`} />
            ))}

            {/* Calendar days */}
            {daysInMonth.map(date => {
              const slotsForDate = getSlotsForDate(date);
              const hasSlots = slotsForDate.length > 0;
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={date.toString()}
                  onClick={() => handleDateClick(date)}
                  className={`
                    relative p-2 rounded-lg border-2 transition-all min-h-[60px]
                    ${isToday 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : hasSlots
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20 hover:border-green-600'
                      : 'border-border hover:border-primary'
                    }
                    hover:shadow-md hover:scale-105
                  `}
                >
                  <div className="text-sm font-semibold">{format(date, "d")}</div>
                  {hasSlots && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {slotsForDate.length} slot{slotsForDate.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Display Saved Slots */}
          {savedAvailability.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Your Availability Slots</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedAvailability
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((avail) => {
                    const isEditing = editingSlot === avail.id;
                    const displayStart = isEditing && editingValues ? editingValues.startTime : (avail.startTime || "09:00");
                    const displayEnd = isEditing && editingValues ? editingValues.endTime : (avail.endTime || "17:00");

                    return (
                      <div
                        key={avail.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isEditing
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800'
                            : 'bg-background border-border hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1">
                            <Badge variant="outline" className="text-xs font-medium">
                              {format(new Date(avail.date), "MMM d, yyyy")}
                            </Badge>
                            <Input
                              type="time"
                              step="60"
                              value={displayStart}
                              onChange={(e) => {
                                if (isEditing) {
                                  setEditingValues({
                                    startTime: e.target.value,
                                    endTime: displayEnd
                                  });
                                }
                              }}
                              className="w-24 h-8 text-xs"
                              disabled={!isEditing}
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <Input
                              type="time"
                              step="60"
                              value={displayEnd}
                              onChange={(e) => {
                                if (isEditing) {
                                  setEditingValues({
                                    startTime: displayStart,
                                    endTime: e.target.value
                                  });
                                }
                              }}
                              className="w-24 h-8 text-xs"
                              disabled={!isEditing}
                            />
                            <Badge variant="secondary" className="text-xs">
                              {avail.availableHours || calculateHours(displayStart, displayEnd)}h
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingSlot(avail.id!);
                                    setEditingValues({
                                      startTime: avail.startTime || "09:00",
                                      endTime: avail.endTime || "17:00"
                                    });
                                  }}
                                  className="h-7 w-7 text-primary hover:text-primary"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(avail.id!)}
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (editingValues) {
                                      updateMutation.mutate({
                                        id: avail.id!,
                                        startTime: editingValues.startTime,
                                        endTime: editingValues.endTime
                                      });
                                    }
                                  }}
                                  className="h-7 w-7 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingSlot(null);
                                    setEditingValues(null);
                                  }}
                                  className="h-7 w-7 text-muted-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Time Slot Dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Slot</DialogTitle>
            <DialogDescription>
              Add availability for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                step="60"
                value={newSlotTime.startTime}
                onChange={(e) => setNewSlotTime({ ...newSlotTime, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                step="60"
                value={newSlotTime.endTime}
                onChange={(e) => setNewSlotTime({ ...newSlotTime, endTime: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Badge variant="secondary">
                Duration: {calculateHours(newSlotTime.startTime, newSlotTime.endTime)} hours
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDate(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;
  return Math.max(0, (endTotal - startTotal) / 60);
}