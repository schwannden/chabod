import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

interface TenantBreadcrumbProps {
  tenantName: string;
  tenantSlug: string;
  items: {
    label: string;
    path?: string;
  }[];
}

// Separate component to handle the segment with separator and item
const BreadcrumbSegment = ({ item }: { item: { label: string; path?: string } }) => (
  <>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      {item.path ? (
        <BreadcrumbLink asChild>
          <Link to={item.path}>{item.label}</Link>
        </BreadcrumbLink>
      ) : (
        <BreadcrumbPage>{item.label}</BreadcrumbPage>
      )}
    </BreadcrumbItem>
  </>
);

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
          <BreadcrumbSegment key={index} item={item} />
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
