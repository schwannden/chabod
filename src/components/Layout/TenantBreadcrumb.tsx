
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface TenantBreadcrumbProps {
  tenantName: string;
  tenantSlug: string;
  items: {
    label: string;
    path?: string;
  }[];
}

export function TenantBreadcrumb({ tenantName, tenantSlug, items }: TenantBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/tenant/${tenantSlug}`}>{tenantName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbSeparator />
            {item.path ? (
              <BreadcrumbLink asChild>
                <Link to={item.path}>{item.label}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
