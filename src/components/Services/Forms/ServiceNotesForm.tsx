import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, X, Check, Plus, Link } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { addServiceNote, deleteServiceNotes } from "@/lib/services";

// Updated schema to validate URLs
const noteFormSchema = z.object({
  text: z.string().min(1, "標題為必填"),
  link: z
    .string()
    .refine(
      (val) =>
        !val ||
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(
          val,
        ),
      { message: "請輸入有效的URL" },
    )
    .optional()
    .or(z.literal("")),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

interface ServiceNotesFormProps {
  notes: NoteFormValues[];
  setNotes: React.Dispatch<React.SetStateAction<NoteFormValues[]>>;
  serviceId?: string;
  tenantId?: string;
  isEditing: boolean;
}

export function ServiceNotesForm({
  notes,
  setNotes,
  serviceId,
  tenantId,
  isEditing,
}: ServiceNotesFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const noteForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      text: "",
      link: "",
    },
  });

  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      text: "",
      link: "",
    },
  });

  const handleAddNote = async () => {
    const values = noteForm.getValues();
    if (noteForm.formState.isValid) {
      try {
        // Add note to database if editing an existing service
        if (isEditing && serviceId && tenantId) {
          await addServiceNote({
            service_id: serviceId,
            tenant_id: tenantId,
            text: values.text,
            link: values.link || null,
          });
        }

        // Always update local state
        setNotes([...notes, values]);
        noteForm.reset();
      } catch (error) {
        console.error("Error adding service note:", error);
        toast.error("新增備註時發生錯誤");
      }
    } else {
      noteForm.trigger();
    }
  };

  const handleEditNote = (index: number) => {
    setEditingIndex(index);
    const note = notes[index];
    editForm.reset({
      text: note.text,
      link: note.link || "",
    });
  };

  const handleSaveEdit = async (index: number) => {
    const values = editForm.getValues();
    if (editForm.formState.isValid) {
      try {
        // For editing existing notes, we delete all and re-add them
        // since there's no direct update function
        if (isEditing && serviceId && tenantId) {
          await deleteServiceNotes(serviceId);

          // Prepare updated notes list
          const updatedNotes = [...notes];
          updatedNotes[index] = values;

          // Re-add all notes to the database
          for (const note of updatedNotes) {
            await addServiceNote({
              service_id: serviceId,
              tenant_id: tenantId,
              text: note.text,
              link: note.link || null,
            });
          }

          // Update local state
          setNotes(updatedNotes);
        } else {
          // Just update local state for new services
          const updatedNotes = [...notes];
          updatedNotes[index] = values;
          setNotes(updatedNotes);
        }

        setEditingIndex(null);
      } catch (error) {
        console.error("Error updating service note:", error);
        toast.error("更新備註時發生錯誤");
      }
    } else {
      editForm.trigger();
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleDeleteNote = async (index: number) => {
    try {
      // For deleting notes, we delete all and re-add the remaining ones
      if (isEditing && serviceId && tenantId) {
        await deleteServiceNotes(serviceId);

        // Filter out the deleted note
        const updatedNotes = notes.filter((_, i) => i !== index);

        // Re-add all remaining notes
        for (const note of updatedNotes) {
          await addServiceNote({
            service_id: serviceId,
            tenant_id: tenantId,
            text: note.text,
            link: note.link || null,
          });
        }

        // Update local state
        setNotes(updatedNotes);
      } else {
        // Just update local state for new services
        setNotes(notes.filter((_, i) => i !== index));
      }

      if (editingIndex === index) {
        setEditingIndex(null);
      }
    } catch (error) {
      console.error("Error deleting service note:", error);
      toast.error("刪除備註時發生錯誤");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">新增服事備註</h3>
      <Form {...noteForm}>
        <form className="space-y-4">
          <FormField
            control={noteForm.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>內容</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="備註內容" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={noteForm.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <Link className="h-4 w-4" />
                  連結 URL
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input {...field} placeholder="https://example.com" className="pl-10" />
                    <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" onClick={handleAddNote}>
            <Plus className="mr-2 h-4 w-4" />
            新增備註
          </Button>
        </form>
      </Form>

      {notes.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">已新增備註</h4>
          <ScrollArea className="h-40 border rounded-md p-2">
            <div className="space-y-2">
              {notes.map((note, index) => (
                <div key={index} className="bg-secondary p-2 rounded-md">
                  {editingIndex === index ? (
                    <Form {...editForm}>
                      <form className="space-y-2">
                        <FormField
                          control={editForm.control}
                          name="text"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="備註內容" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="link"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">連結 URL</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    placeholder="https://example.com"
                                    className="pl-10"
                                  />
                                  <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">取消</span>
                          </Button>
                          <Button type="button" size="sm" onClick={() => handleSaveEdit(index)}>
                            <Check className="h-4 w-4" />
                            <span className="sr-only">儲存</span>
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{note.text}</h5>
                        {note.link && (
                          <a
                            href={note.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center mt-1"
                          >
                            <Link className="h-3 w-3 mr-1" />
                            {note.link}
                          </a>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500"
                          onClick={() => handleEditNote(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">編輯備註</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          onClick={() => handleDeleteNote(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">刪除備註</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
