
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Group } from "@/lib/types";

interface ServiceGroupsFormProps {
  groups: Group[];
  selectedGroups: string[];
  setSelectedGroups: (groups: string[]) => void;
}

export function ServiceGroupsForm({
  groups,
  selectedGroups,
  setSelectedGroups,
}: ServiceGroupsFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">選擇服事小組</h3>
      <ScrollArea className="h-72 border rounded-md p-2">
        <div className="space-y-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={selectedGroups.includes(group.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedGroups([...selectedGroups, group.id]);
                    } else {
                      setSelectedGroups(
                        selectedGroups.filter((id) => id !== group.id)
                      );
                    }
                  }}
                />
                <label
                  htmlFor={`group-${group.id}`}
                  className="text-sm font-medium"
                >
                  {group.name}
                </label>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">尚未有小組</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
