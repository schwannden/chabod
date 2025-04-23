
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AuthPasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  onForgotPassword?: () => void;
  showForgotPassword?: boolean;
}

export function AuthPasswordInput({
  id = "password",
  value,
  onChange,
  required = true,
  disabled,
  onForgotPassword,
  showForgotPassword,
}: AuthPasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id}>密碼</Label>
        {showForgotPassword && onForgotPassword && (
          <Button variant="link" className="px-0" type="button" onClick={onForgotPassword}>
            忘記密碼？
          </Button>
        )}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder="輸入密碼"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoComplete="current-password"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
        >
          {show ? (
            // eye-off icon
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.04 10.04 0 0 1 12 20c-5 0-9.27-3-11-8 1.11-2.66 2.85-4.89 5.06-6.47"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.98 3.98 0 0 1 12 8c2.21 0 4 1.79 4 4 0 .67-.17 1.3-.47 1.84"/><path d="M21 21L3 3"/></svg>
          ) : (
            // eye icon
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.05 12C3.81 7.61 7.95 4.5 12 4.5c4.05 0 8.19 3.11 9.95 7.5-1.76 4.39-5.9 7.5-9.95 7.5-4.05 0-8.19-3.11-9.95-7.5z"/></svg>
          )}
        </Button>
      </div>
    </div>
  );
}
