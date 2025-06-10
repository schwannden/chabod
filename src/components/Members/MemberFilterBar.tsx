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
import { useTranslation } from "react-i18next";

export interface MemberFilterBarProps {
  searchName: string;
  setSearchName: (value: string) => void;
  searchEmail: string;
  setSearchEmail: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
}

export function MemberFilterBar({
  searchName,
  setSearchName,
  searchEmail,
  setSearchEmail,
  roleFilter,
  setRoleFilter,
}: MemberFilterBarProps) {
  const { t } = useTranslation();

  return (
    <FilterLayout>
      <FilterGroup label={t("members.name")}>
        <Input
          placeholder={t("members.searchName")}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="max-w-sm"
        />
      </FilterGroup>

      <FilterGroup label="Email">
        <Input
          placeholder={t("members.searchEmail")}
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="max-w-sm"
        />
      </FilterGroup>

      <FilterGroup label={t("members.role")}>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("members.selectRole")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("members.allRoles")}</SelectItem>
            <SelectItem value="owner">{t("members.admin")}</SelectItem>
            <SelectItem value="member">{t("members.member")}</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>
    </FilterLayout>
  );
}
