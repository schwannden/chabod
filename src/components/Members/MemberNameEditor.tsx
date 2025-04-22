
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface MemberNameEditorProps {
  firstName: string;
  lastName: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function MemberNameEditor({
  firstName,
  lastName,
  setFirstName,
  setLastName,
  onSave,
  onCancel,
  isLoading,
}: MemberNameEditorProps) {
  return (
    <div className="flex gap-2 items-center">
      <Input 
        value={firstName} 
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="名字"
        className="w-full max-w-[150px]"
      />
      <Input 
        value={lastName} 
        onChange={(e) => setLastName(e.target.value)}
        placeholder="姓氏"
        className="w-full max-w-[150px]"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onSave}
        disabled={isLoading}
      >
        <Save className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        disabled={isLoading}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
