
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ServiceFormValues } from "../hooks/useServiceForm";

interface ServiceDetailsFormProps {
  form: ReturnType<typeof useForm<ServiceFormValues>>;
}

export function ServiceDetailsForm({ form }: ServiceDetailsFormProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Trim the name on blur, but allow typing with spaces
    form.setValue("name", e.target.value);
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Trim whitespace when field loses focus
    form.setValue("name", e.target.value.trim());
  };

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名稱</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="default_start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>預設開始時間</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="default_end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>預設結束時間</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
