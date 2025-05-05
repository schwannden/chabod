import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface MemberRoleSelectProps {
  role: string;
  onRoleChange: (role: string) => void;
  isCurrentUserOwner: boolean;
}

export function MemberRoleSelect({
  role,
  onRoleChange,
  isCurrentUserOwner,
}: MemberRoleSelectProps) {
  const translateRole = (role: string): string => {
    switch (role) {
      case "owner":
        return "管理者";
      case "member":
        return "一般會友";
      default:
        return role;
    }
  };

  if (!isCurrentUserOwner) {
    return <span className="capitalize">{translateRole(role)}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="capitalize">
          {translateRole(role)} <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onRoleChange("管理者")}>管理者</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRoleChange("一般會友")}>一般會友</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
