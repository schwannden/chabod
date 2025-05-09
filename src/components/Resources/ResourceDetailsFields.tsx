import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AVAILABLE_ICONS } from "./resource-icons";
import { Group } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResourceDetailsFieldsProps {
  name: string;
  description: string;
  url: string;
  icon: string;
  selectedGroups: string[];
  groups: Group[];
  urlError?: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onGroupToggle: (groupId: string) => void;
  iconSearchOpen?: boolean;
  setIconSearchOpen?: (open: boolean) => void;
}

export function ResourceDetailsFields({
  name,
  description,
  url,
  icon,
  selectedGroups,
  groups,
  urlError,
  onNameChange,
  onDescriptionChange,
  onUrlChange,
  onIconChange,
  onGroupToggle,
}: ResourceDetailsFieldsProps) {
  const IconComponent = AVAILABLE_ICONS.find((i) => i.value === icon)?.icon;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNameChange(e.target.value);
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onNameChange(e.target.value.trim());
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDescriptionChange(e.target.value);
  };

  const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    onDescriptionChange(e.target.value.trim());
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUrlChange(e.target.value);
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onUrlChange(e.target.value.trim());
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="icon">圖示</Label>
        <Select value={icon} onValueChange={onIconChange}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <SelectValue>
                {AVAILABLE_ICONS.find((i) => i.value === icon)?.label || "Select icon"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {AVAILABLE_ICONS.map((iconOption) => (
              <SelectItem
                key={iconOption.value}
                value={iconOption.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <iconOption.icon className="h-4 w-4 mr-2" />
                  {iconOption.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">資源名稱</Label>
        <Input
          id="name"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          placeholder="輸入資源名稱"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">描述 (可選)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionBlur}
          placeholder="輸入資源描述"
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="url">網址</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          placeholder="輸入資源連結"
          required
          className={urlError ? "border-red-500" : ""}
        />
        {urlError && <p className="text-sm text-red-500">{urlError}</p>}
      </div>

      <div className="grid gap-2">
        <Label>群組</Label>
        <div className="border rounded-md p-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="flex items-center gap-2 p-1">
                <input
                  type="checkbox"
                  id={`group-${group.id}`}
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => onGroupToggle(group.id)}
                  className="h-4 w-4"
                />
                <label htmlFor={`group-${group.id}`} className="text-sm">
                  {group.name}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">無可用群組</p>
          )}
        </div>
      </div>
    </div>
  );
}
