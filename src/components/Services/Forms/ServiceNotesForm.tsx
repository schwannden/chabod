
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
import { Trash2 } from "lucide-react";

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
  const noteForm = useForm<NoteFormValues>({
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

  const handleDeleteNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
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
                <div key={index} className="bg-secondary p-2 rounded-md flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{note.title}</h5>
                    <p className="text-sm text-muted-foreground">
                      {note.content}
                    </p>
                  </div>
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
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
