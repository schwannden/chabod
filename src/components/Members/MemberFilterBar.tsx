import { FilterLayout } from "@/components/Layout/FilterLayout";
import { FilterGroup } from "@/components/Layout/FilterGroup";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemberFilterBarProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  emailFilter: string;
  setEmailFilter: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
}

export function MemberFilterBar({
  nameFilter,
  setNameFilter,
  emailFilter,
  setEmailFilter,
  roleFilter,
  setRoleFilter,
}: MemberFilterBarProps) {
  return (
    <FilterLayout>
      <FilterGroup label="名稱">
        <Input
          placeholder="搜尋名稱"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
      </FilterGroup>

      <FilterGroup label="email">
        <Input
          placeholder="搜尋email"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
        />
      </FilterGroup>

      <FilterGroup label="角色">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="選擇角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有角色</SelectItem>
            <SelectItem value="owner">管理者</SelectItem>
            <SelectItem value="member">一般會友</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>
    </FilterLayout>
  );
}
