import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ServiceEventForCard } from "./ServiceScheduleCard";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ServiceEventRoleAssignmentList,
  RoleAssignment,
  AssignedMember,
} from "@/components/ServiceEvents/ServiceEventRoleAssignmentList";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { getServiceEventOwners } from "@/lib/services/service-event-owners";
import { supabase } from "@/integrations/supabase/client";
import { ServiceRole } from "@/lib/services/types";

// Define the form schema with Zod for validation
const serviceScheduleSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  subtitle: z.string().optional(),
});

export type ServiceScheduleFormValues = z.infer<typeof serviceScheduleSchema>;

export interface ServiceScheduleUpdateData {
  date: string;
  startTime: string;
  endTime: string;
  subtitle: string | null;
  owners: Array<{ userId: string; roleId: string }>;
}

interface ServiceScheduleCardEditProps {
  event: ServiceEventForCard;
  onSave: (updates: ServiceScheduleUpdateData) => Promise<void>;
  onCancel: () => void;
}

export function ServiceScheduleCardEdit({ event, onSave, onCancel }: ServiceScheduleCardEditProps) {
  const { t } = useTranslation(["services", "common"]);
  const { toast } = useToast();
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);

  const form = useForm<ServiceScheduleFormValues>({
    resolver: zodResolver(serviceScheduleSchema),
    defaultValues: {
      date: event.date,
      startTime: event.start_time,
      endTime: event.end_time,
      subtitle: event.subtitle || "",
    },
  });

  // Load existing owners and convert to RoleAssignment format
  useEffect(() => {
    const fetchOwnersAndRoles = async () => {
      setIsLoadingOwners(true);
      try {
        // Fetch all roles for this service
        const { data: rolesData, error: rolesError } = await supabase
          .from("service_roles")
          .select("*")
          .eq("service_id", event.service_id)
          .order("name");

        if (rolesError) throw rolesError;

        // Fetch existing owners for this event
        const ownersData = await getServiceEventOwners(event.id);

        // Create RoleAssignment structure: all roles with their assigned members
        const assignments: RoleAssignment[] = (rolesData || []).map((role) => {
          // Find all owners for this role
          const roleOwners = ownersData.filter((owner) => owner.service_role_id === role.id);

          // Convert to AssignedMember format
          const assignedMembers: AssignedMember[] = roleOwners.map((owner) => ({
            userId: owner.user_id,
            profile: owner.profile,
          }));

          return {
            roleId: role.id,
            role: role as ServiceRole,
            assignedMembers,
          };
        });

        setRoleAssignments(assignments);
      } catch (error) {
        console.error("Error loading event owners:", error);
        toast({
          title: t("services:error"),
          description: t("services:loadingError"),
          variant: "destructive",
        });
      } finally {
        setIsLoadingOwners(false);
      }
    };

    fetchOwnersAndRoles();
  }, [event.id, event.service_id, toast, t]);

  const handleSubmit = async (values: ServiceScheduleFormValues) => {
    // Convert roleAssignments back to owners format for the parent component
    const owners = roleAssignments.flatMap((assignment) =>
      assignment.assignedMembers.map((member) => ({
        userId: member.userId,
        roleId: assignment.roleId,
      })),
    );

    const updates = {
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      subtitle: values.subtitle || null,
      owners,
    };

    await onSave(updates);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} onKeyDown={handleKeyDown}>
        <CardContent className="space-y-4 pt-6">
          <FormField
            name="date"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("services:date")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="startTime"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("services:startTime")}</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="endTime"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("services:endTime")}</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            name="subtitle"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("services:subtitle")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("services:notesOptional")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isLoadingOwners && (
            <div>
              <FormLabel>{t("services:allServiceRoles")}</FormLabel>
              <ServiceEventRoleAssignmentList
                tenantId={event.tenant_id}
                serviceId={event.service_id}
                roleAssignments={roleAssignments}
                setRoleAssignments={setRoleAssignments}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("services:cancelEdit")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isLoadingOwners}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common:saving")}
                </>
              ) : (
                t("services:saveSchedule")
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Form>
  );
}
