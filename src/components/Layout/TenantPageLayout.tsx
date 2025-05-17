import { ReactNode } from "react";
import { NavBar } from "@/components/Layout/NavBar";
import { TenantBreadcrumb } from "@/components/Layout/TenantBreadcrumb";
import { Loader2 } from "lucide-react";

interface TenantPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  tenantName: string;
  tenantSlug: string;
  isLoading?: boolean;
  breadcrumbItems: Array<{ label: string; path?: string }>;
  action?: ReactNode;
}

export function TenantPageLayout({
  children,
  title,
  description,
  tenantName,
  tenantSlug,
  isLoading = false,
  breadcrumbItems,
  action,
}: TenantPageLayoutProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">載入中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 space-y-6">
          <TenantBreadcrumb
            tenantName={tenantName}
            tenantSlug={tenantSlug}
            items={breadcrumbItems}
          />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
