import { ReactNode } from "react";

interface FilterGroupProps {
  label: string;
  children: ReactNode;
}

export function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="flex flex-col space-y-2 min-w-[200px]">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
