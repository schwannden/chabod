
import { useQuery } from "@tanstack/react-query";
import { getServiceNotes } from "@/lib/services/service-notes";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ServiceNoteView({ serviceId }: { serviceId: string }) {
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ["serviceNotes", serviceId],
    queryFn: () => getServiceNotes(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-muted-foreground text-center">尚未添加服事備註</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {notes.map((note, index) => (
            <AccordionItem key={note.id || index} value={note.id || `note-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="font-medium truncate">{note.text.substring(0, 30)}{note.text.length > 30 ? '...' : ''}</div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="whitespace-pre-wrap mb-2">{note.text}</p>
                {note.link && (
                  <a 
                    href={note.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm block"
                  >
                    {note.link}
                  </a>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
