import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthEmailInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function AuthEmailInput({
  id = "email",
  value,
  onChange,
  disabled,
  required = true,
}: AuthEmailInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing with spaces but trim when passing to parent
    onChange(e.target.value.trim());
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>電子郵件</Label>
      <Input
        id={id}
        type="email"
        placeholder="your@email.com"
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        autoComplete="email"
      />
    </div>
  );
}
