import { useQuery } from "@tanstack/react-query";
import { getServiceNotes } from "@/lib/services/service-notes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar, FileText, PlusCircle, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ServiceNoteView({ serviceId }: { serviceId: string }) {
  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["serviceNotes", serviceId],
    queryFn: () => getServiceNotes(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">尚未添加服事備註</p>
          <Button variant="outline" size="sm" disabled className="opacity-50">
            <PlusCircle className="mr-2 h-4 w-4" />
            添加備註
          </Button>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {notes.map((note, index) => (
            <AccordionItem key={note.id || index} value={note.id || `note-${index}`}>
              <AccordionTrigger className="hover:no-underline px-3 py-2 group">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-md">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="font-medium text-left">
                    {note.text.substring(0, 30)}
                    {note.text.length > 30 ? "..." : ""}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>更新於: {new Date(note.updated_at).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap mb-2 mt-4 text-sm">{note.text}</p>
                {note.link && (
                  <div className="mt-4">
                    <a
                      href={note.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                    >
                      <Link className="h-4 w-4" />
                      {note.link}
                    </a>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
