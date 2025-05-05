import { Search } from "lucide-react";
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
import { Group } from "@/lib/types";

interface ResourceFilterBarProps {
  textFilter: string;
  setTextFilter: (value: string) => void;
  selectedGroup: string;
  setSelectedGroup: (value: string) => void;
  groups: Group[];
}

export function ResourceFilterBar({
  textFilter,
  setTextFilter,
  selectedGroup,
  setSelectedGroup,
  groups = [],
}: ResourceFilterBarProps) {
  return (
    <FilterLayout>
      <FilterGroup label="搜尋">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋資源名稱、描述或連結"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            className="pl-8"
          />
        </div>
      </FilterGroup>

      <FilterGroup label="群組">
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="選擇群組" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有群組</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
    </FilterLayout>
  );
}
