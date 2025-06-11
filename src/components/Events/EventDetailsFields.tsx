import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/hooks/useEventForm";
import { Group } from "@/lib/types";
import { useEffect } from "react";
import { formatDateForInput, parseDateFromInput } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";

interface EventDetailsFieldsProps {
  form: UseFormReturn<EventFormValues>;
  groups: Group[];
}

export function EventDetailsFields({ form, groups = [] }: EventDetailsFieldsProps) {
  const isFullDay = form.watch("isFullDay");
  const selectedGroups = form.watch("groups") || [];
  const { t } = useTranslation();

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
    const currentGroups = form.getValues("groups") || [];
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter((id) => id !== groupId)
      : [...currentGroups, groupId];
    form.setValue("groups", newGroups);
  };

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("events:eventName")}</FormLabel>
            <FormControl>
              <Input placeholder={t("events:eventNamePlaceholder")} {...field} />
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
            <FormLabel>{t("events:description")}</FormLabel>
            <FormControl>
              <Input placeholder={t("events:descriptionPlaceholder")} {...field} />
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
            <FormLabel>{t("events:date")}</FormLabel>
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
              <FormLabel>{t("events:groups")}</FormLabel>
              <FormControl>
                {groups.length > 0 ? (
                  <div className="border rounded-md p-2">
                    <p className="text-sm mb-2">{t("events:availableGroups")}</p>
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
                    {t("events:noGroupsAvailable")}
                  </div>
                )}
              </FormControl>
              <FormDescription>{t("events:selectGroupsDescription")}</FormDescription>
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
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel>{t("events:fullDayEvent")}</FormLabel>
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
                <FormLabel>{t("events:startTime")}</FormLabel>
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
                <FormLabel>{t("events:endTime")}</FormLabel>
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
            <FormLabel>{t("events:eventLink")}</FormLabel>
            <FormControl>
              <Input type="url" placeholder={t("events:eventLinkPlaceholder")} {...field} />
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
              <FormLabel>{t("events:privateEvent")}</FormLabel>
              <FormDescription>{t("events:privateEventDescription")}</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value === "private"}
                onCheckedChange={(checked) => field.onChange(checked ? "private" : "public")}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}
