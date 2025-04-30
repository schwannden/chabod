import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/hooks/useEventForm";
import { Group } from "@/lib/types";
import { useEffect } from "react";
import { formatDateForInput, parseDateFromInput } from "@/lib/dateUtils";

interface EventDetailsFieldsProps {
  form: UseFormReturn<EventFormValues>;
  groups: Group[];
}

export function EventDetailsFields({ form, groups = [] }: EventDetailsFieldsProps) {
  const isFullDay = form.watch("isFullDay");
  const selectedGroups = form.watch("groups") || [];

  console.log("EventDetailsFields rendering with groups:", groups);
  console.log("Selected groups:", selectedGroups);

  useEffect(() => {
    console.log("EventDetailsFields mounted/updated");
    console.log("Groups prop:", groups);
    // Clean up function
    return () => {
      console.log("EventDetailsFields unmounting");
    };
  }, [groups]);

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
            <FormControl>
              <Input
                type="date"
                value={formatDateForInput(field.value)}
                onChange={(e) => field.onChange(parseDateFromInput(e.target.value))}
                onBlur={field.onBlur} // Keep react-hook-form's blur handling
                name={field.name} // Keep react-hook-form's name handling
                ref={field.ref} // Keep react-hook-form's ref handling
                className={cn(!field.value && "text-muted-foreground")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="groups"
        render={({ field }) => {
          console.log("Groups field rendering, field value:", field.value);
          console.log("groups in render:", groups);
          
          return (
            <FormItem>
              <FormLabel>Groups</FormLabel>
              <FormControl>
                {groups.length > 0 ? (
                  <div className="border rounded-md p-2">
                    <p className="text-sm mb-2">Available Groups:</p>
                    {groups.map((group) => (
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
