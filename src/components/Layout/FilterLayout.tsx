
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface FilterLayoutProps {
  children: ReactNode;
  className?: string;
}

export function FilterLayout({ children, className = "" }: FilterLayoutProps) {
  return (
    <Card className={`p-4 mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-end">
        {children}
      </div>
    </Card>
  );
}
