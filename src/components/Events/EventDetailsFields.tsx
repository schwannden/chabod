
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/hooks/useEventForm";
import { Group } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useEffect } from "react";

interface EventDetailsFieldsProps {
  form: UseFormReturn<EventFormValues>;
  groups: Group[];
}

export function EventDetailsFields({ form, groups = [] }: EventDetailsFieldsProps) {
  const isFullDay = form.watch("isFullDay");
  const selectedGroups = form.watch("groups") || [];

  console.log("EventDetailsFields rendering with groups:", groups);
  console.log("Selected groups:", selectedGroups);

  // Ensure groups is always a valid array
  const safeGroups = Array.isArray(groups) ? groups : [];
  console.log("Safe groups after check:", safeGroups);

  useEffect(() => {
    console.log("EventDetailsFields mounted/updated");
    console.log("Groups prop:", groups);
    console.log("safeGroups:", safeGroups);
    // Clean up function
    return () => {
      console.log("EventDetailsFields unmounting");
    };
  }, [groups, safeGroups]);

  const toggleGroup = (groupId: string) => {
    console.log("toggleGroup called with groupId:", groupId);
    const currentGroups = form.getValues("groups") || [];
    console.log("Current groups before toggle:", currentGroups);
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter((id) => id !== groupId)
      : [...currentGroups, groupId];
    console.log("New groups after toggle:", newGroups);
    form.setValue("groups", newGroups);
  };

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter event name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="Enter event description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <CalendarComponent
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="groups"
        render={({ field }) => {
          console.log("Groups field rendering, field value:", field.value);
          console.log("safeGroups in render:", safeGroups);
          
          return (
            <FormItem>
              <FormLabel>Groups</FormLabel>
              <FormControl>
                {safeGroups.length > 0 ? (
                  <div className="border rounded-md p-2">
                    <p className="text-sm mb-2">Available Groups:</p>
                    {safeGroups.map((group) => (
                      <div key={group.id} className="flex items-center gap-2 p-1">
                        <input
                          type="checkbox"
                          id={`group-${group.id}`}
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`group-${group.id}`} className="text-sm">
                          {group.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 border rounded-md text-sm text-muted-foreground">
                    No groups available
                  </div>
                )}
              </FormControl>
              <FormDescription>Select groups that will be associated with this event</FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="isFullDay"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel>Full day event</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isFullDay && (
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="event_link"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Link (Optional)</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://example.com"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Private Event</FormLabel>
              <FormDescription>
                Make this event private (only visible to members)
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value === "private"}
                onCheckedChange={(checked) =>
                  field.onChange(checked ? "private" : "public")
                }
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}
