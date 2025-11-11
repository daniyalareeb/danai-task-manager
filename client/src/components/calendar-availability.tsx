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
    
    // Validate date is not in the past
    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    if (selectedDateObj < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot add availability for past dates.",
        variant: "destructive",
      });
      setSelectedDate(null);
      return;
    }
    
    // If date is today, validate time hasn't passed
    const now = new Date();
    const isToday = selectedDateObj.getTime() === today.getTime();
    
    if (isToday) {
      const [endHour, endMin] = newSlotTime.endTime.split(':').map(Number);
      const slotEnd = new Date();
      slotEnd.setHours(endHour, endMin, 0, 0);
      
      if (slotEnd < now) {
        toast({
          title: "Invalid Time",
          description: "Cannot add availability for times that have already passed.",
          variant: "destructive",
        });
        return;
      }
      
      // If start time is in the past, adjust it
      const [startHour, startMin] = newSlotTime.startTime.split(':').map(Number);
      const slotStart = new Date();
      slotStart.setHours(startHour, startMin, 0, 0);
      
      if (slotStart < now) {
        const adjustedStart = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        toast({
          title: "Time Adjusted",
          description: `Start time adjusted to current time (${adjustedStart}).`,
        });
        setNewSlotTime({ ...newSlotTime, startTime: adjustedStart });
        // Continue with adjusted time
      }
    }
    
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
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
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
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-6">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-xs md:text-sm font-semibold text-muted-foreground py-2">
                {day.substring(0, 3)}
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

              const dateToCheck = new Date(date);
              dateToCheck.setHours(0, 0, 0, 0);
              const todayCheck = new Date(today);
              todayCheck.setHours(0, 0, 0, 0);
              const isPast = dateToCheck < todayCheck;

              return (
                <button
                  key={date.toString()}
                  onClick={() => {
                    if (isPast) {
                      toast({
                        title: "Invalid Date",
                        description: "Cannot add availability for past dates.",
                        variant: "destructive",
                      });
                      return;
                    }
                    handleDateClick(date);
                  }}
                  disabled={isPast}
                  className={`
                    relative p-2 md:p-3 rounded-xl border-2 transition-all min-h-[50px] md:min-h-[60px] flex flex-col items-center justify-center
                    ${isPast
                      ? 'opacity-40 cursor-not-allowed border-muted bg-muted/30'
                      : isToday 
                      ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md' 
                      : hasSlots
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/30 hover:border-green-500 hover:shadow-md'
                      : 'border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50'
                    }
                    ${!isPast ? 'hover:scale-105 active:scale-95' : ''}
                  `}
                >
                  <div className={`text-sm md:text-base font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {format(date, "d")}
                  </div>
                  {hasSlots && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-[9px] md:text-[10px] px-1.5 py-0.5 h-4 md:h-5 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                        {slotsForDate.length}
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Display Saved Slots */}
          {savedAvailability.length > 0 && (
            <div className="mt-6 pb-20 md:pb-6">
              <h4 className="text-sm md:text-base font-semibold mb-4 text-foreground">Your Availability Slots</h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {savedAvailability
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((avail) => {
                    const isEditing = editingSlot === avail.id;
                    const displayStart = isEditing && editingValues ? editingValues.startTime : (avail.startTime || "09:00");
                    const displayEnd = isEditing && editingValues ? editingValues.endTime : (avail.endTime || "17:00");
                    const availDate = new Date(avail.date);
                    const slotEnd = new Date(availDate);
                    const [endHour, endMin] = (avail.endTime || "23:59").split(':').map(Number);
                    slotEnd.setHours(endHour, endMin, 0, 0);
                    const isPast = slotEnd < new Date();

                    return (
                      <Card
                        key={avail.id}
                        className={`transition-all ${
                          isEditing
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800'
                            : isPast
                            ? 'opacity-50 border-muted bg-muted/30'
                            : 'bg-card border-border hover:shadow-md hover:border-primary/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Badge variant="outline" className="text-xs font-medium shrink-0 bg-primary/5 border-primary/20 whitespace-nowrap">
                                {format(new Date(avail.date), "MMM d, yyyy")}
                              </Badge>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 bg-primary/10 dark:bg-primary/20 rounded-lg px-3.5 py-2.5 border border-primary/20">
                                  <span className="text-sm font-mono font-bold text-foreground whitespace-nowrap">{displayStart}</span>
                                  <span className="text-xs text-muted-foreground shrink-0 mx-0.5">→</span>
                                  <span className="text-sm font-mono font-bold text-foreground whitespace-nowrap">{displayEnd}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs font-semibold shrink-0 bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                                  {typeof avail.availableHours === 'number' 
                                    ? avail.availableHours % 1 === 0 
                                      ? `${avail.availableHours}h` 
                                      : `${avail.availableHours.toFixed(1)}h`
                                    : `${calculateHours(displayStart, displayEnd).toFixed(1)}h`}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
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
                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(avail.id!)}
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingSlot(null);
                                      setEditingValues(null);
                                    }}
                                    className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
                value={newSlotTime.startTime}
                onChange={(e) => setNewSlotTime({ ...newSlotTime, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={newSlotTime.endTime}
                onChange={(e) => setNewSlotTime({ ...newSlotTime, endTime: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Badge variant="secondary">
                Duration: {(() => {
                  const hours = calculateHours(newSlotTime.startTime, newSlotTime.endTime);
                  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
                })()}
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