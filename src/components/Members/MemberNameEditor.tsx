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
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  };

  const handleSave = () => {
    // Trim whitespace before saving
    setFirstName(firstName.trim());
    setLastName(lastName.trim());
    onSave();
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={firstName}
        onChange={handleFirstNameChange}
        placeholder="名字"
        className="w-full max-w-[150px]"
      />
      <Input
        value={lastName}
        onChange={handleLastNameChange}
        placeholder="姓氏"
        className="w-full max-w-[150px]"
      />
      <Button variant="ghost" size="icon" onClick={handleSave} disabled={isLoading}>
        <Save className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
