import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MemberNameEditorProps {
  firstName: string;
  lastName: string;
  onUpdate: (firstName: string, lastName: string) => void;
  disabled?: boolean;
}

export function MemberNameEditor({
  firstName,
  lastName,
  onUpdate,
  disabled = false,
}: MemberNameEditorProps) {
  const { t } = useTranslation();
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localLastName, setLocalLastName] = useState(lastName);

  useEffect(() => {
    setLocalFirstName(firstName);
    setLocalLastName(lastName);
  }, [firstName, lastName]);

  const handleFirstNameChange = (value: string) => {
    setLocalFirstName(value);
    onUpdate(value, localLastName);
  };

  const handleLastNameChange = (value: string) => {
    setLocalLastName(value);
    onUpdate(localFirstName, value);
  };

  const handleSave = () => {
    // Trim whitespace before saving
    setLocalFirstName(localFirstName.trim());
    setLocalLastName(localLastName.trim());
    onUpdate(localFirstName, localLastName);
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={localFirstName}
        onChange={(e) => handleFirstNameChange(e.target.value)}
        placeholder={t("members.firstName")}
        disabled={disabled}
        className="w-full max-w-[150px] text-sm"
      />
      <Input
        value={localLastName}
        onChange={(e) => handleLastNameChange(e.target.value)}
        placeholder={t("members.lastName")}
        disabled={disabled}
        className="w-full max-w-[150px] text-sm"
      />
      <Button variant="ghost" size="icon" onClick={handleSave} disabled={disabled}>
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
}
