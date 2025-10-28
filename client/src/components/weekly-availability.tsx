import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

export function WeeklyAvailability({ onSave }: { onSave: (schedules: DaySchedule[]) => void }) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDayName, setSelectedDayName] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ startTime: "09:00", endTime: "17:00" }]);

  const addDay = () => {
    if (!selectedDate) return;
    
    const dateObj = new Date(selectedDate);
    const dayName = formatDayName(dateObj.getDay());
    
    setSchedules([...schedules, {
      date: selectedDate,
      dayName,
      slots: timeSlots,
    }]);
    
    // Reset form
    setSelectedDate("");
    setTimeSlots([{ startTime: "09:00", endTime: "17:00" }]);
    setShowForm(false);
  };

  const removeDay = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSlot = (scheduleIndex: number, slotIndex: number, field: "startTime" | "endTime", value: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].slots[slotIndex][field] = value;
    setSchedules(newSchedules);
  };

  const addSlotToDay = (scheduleIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].slots.push({ startTime: "14:00", endTime: "16:00" });
    setSchedules(newSchedules);
  };

  const removeSlotFromDay = (scheduleIndex: number, slotIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].slots = newSchedules[scheduleIndex].slots.filter((_, i) => i !== slotIndex);
    setSchedules(newSchedules);
  };

  const handleSave = () => {
    onSave(schedules);
    setSchedules([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Your Weekly Availability
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Day
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Add your available days to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{schedule.dayName}</Badge>
                          <span className="text-sm text-muted-foreground">{schedule.date}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDay(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {schedule.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex gap-2 items-center">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSlot(index, slotIndex, "startTime", e.target.value)}
                              className="h-9"
                            />
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSlot(index, slotIndex, "endTime", e.target.value)}
                              className="h-9"
                            />
                          </div>
                          {schedule.slots.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSlotFromDay(index, slotIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSlotToDay(index)}
                        className="w-full"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Time Slot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                onClick={handleSave}
                className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80"
              >
                Save All Availability
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Add Available Day</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) {
                    const dayName = formatDayName(new Date(e.target.value).getDay());
                    setSelectedDayName(dayName);
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Time Slots</Label>
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => {
                        const newSlots = [...timeSlots];
                        newSlots[index].startTime = e.target.value;
                        setTimeSlots(newSlots);
                      }}
                    />
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => {
                        const newSlots = [...timeSlots];
                        newSlots[index].endTime = e.target.value;
                        setTimeSlots(newSlots);
                      }}
                    />
                  </div>
                  {timeSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTimeSlots([...timeSlots, { startTime: "14:00", endTime: "16:00" }])}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Time Slot
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={addDay}
                className="flex-1"
              >
                Add Day
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDayName(dayIndex: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex];
}

