import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MemberRoleSelectProps {
  currentRole: string;
  onRoleChange: (newRole: string) => void;
  disabled?: boolean;
}

export function MemberRoleSelect({ currentRole, onRoleChange, disabled }: MemberRoleSelectProps) {
  const { t } = useTranslation();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "owner":
        return t("members:admin");
      case "member":
        return t("members:member");
      default:
        return t("members:member");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 justify-between min-w-[80px]"
          disabled={disabled}
        >
          {getRoleDisplayName(currentRole)}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onRoleChange("owner")}>
          {t("members:admin")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRoleChange("member")}>
          {t("members:member")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
