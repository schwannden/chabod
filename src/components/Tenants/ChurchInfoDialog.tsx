import { TenantWithUsageAndMeta } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ChurchInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithUsageAndMeta;
}

export function ChurchInfoDialog({ isOpen, onOpenChange, tenant }: ChurchInfoDialogProps) {
  const { t } = useTranslation("tenant");
  const meta = tenant.tenant_meta;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("churchInfo")}</DialogTitle>
          <DialogDescription>
            {tenant.name} - {t("churchInfo")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Verification Status */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold">{t("verificationStatus")}</h4>
              <Badge
                variant={meta?.verified ? "secondary" : "outline"}
                className={meta?.verified ? "bg-green-100 text-green-800" : ""}
              >
                {meta?.verified ? t("verified") : t("notVerified")}
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2">{t("contactInformation")}</h4>
            <div className="space-y-2">
              <p>
                {t("contactEmail")}: {meta?.contact_email || t("notSet")}
              </p>
              <p>
                {t("address")}: {meta?.address || t("notSet")}
              </p>
              {meta?.phone_number && (
                <p>
                  {t("phoneNumber")}: {meta.phone_number}
                </p>
              )}
              {meta?.website && (
                <p>
                  {t("website")}:{" "}
                  <a
                    href={meta.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {meta.website}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Administrative Information */}
          {meta?.tax_id && (
            <div className="border rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2">{t("administrativeInformation")}</h4>
              <p>
                {t("taxId")}: {meta.tax_id}
              </p>
            </div>
          )}

          {/* Verification Time */}
          {meta?.verified && meta?.verified_time && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              {t("verifiedOn")} {new Date(meta.verified_time).toLocaleDateString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
