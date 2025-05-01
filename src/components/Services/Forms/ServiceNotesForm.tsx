
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
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Trash2, X, Check, Plus } from "lucide-react";
import { useState } from "react";

const noteFormSchema = z.object({
  title: z.string().min(1, "標題為必填"),
  content: z.string().optional(),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

interface ServiceNotesFormProps {
  notes: NoteFormValues[];
  setNotes: React.Dispatch<React.SetStateAction<NoteFormValues[]>>;
}

export function ServiceNotesForm({ notes, setNotes }: ServiceNotesFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const noteForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const handleAddNote = () => {
    const values = noteForm.getValues();
    if (noteForm.formState.isValid) {
      setNotes([...notes, values]);
      noteForm.reset();
    } else {
      noteForm.trigger();
    }
  };

  const handleEditNote = (index: number) => {
    setEditingIndex(index);
    const note = notes[index];
    editForm.reset({
      title: note.title,
      content: note.content,
    });
  };

  const handleSaveEdit = (index: number) => {
    const values = editForm.getValues();
    if (editForm.formState.isValid) {
      const updatedNotes = [...notes];
      updatedNotes[index] = values;
      setNotes(updatedNotes);
      setEditingIndex(null);
    } else {
      editForm.trigger();
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleDeleteNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">新增服事備註</h3>
      <Form {...noteForm}>
        <form className="space-y-4">
          <FormField
            control={noteForm.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>標題</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="備註標題" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={noteForm.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>內容</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="備註內容" rows={3} />
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
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="備註標題" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea {...field} placeholder="備註內容" rows={2} />
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
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={() => handleSaveEdit(index)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">儲存</span>
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{note.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {note.content}
                        </p>
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
