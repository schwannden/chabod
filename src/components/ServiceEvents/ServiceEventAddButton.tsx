
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ServiceEventAddButtonProps {
  onClick: () => void;
}

export function ServiceEventAddButton({ onClick }: ServiceEventAddButtonProps) {
  return (
    <Button onClick={onClick} variant="outline">
      <PlusCircle className="h-4 w-4 mr-2" />
      新增服事排班
    </Button>
  );
}
