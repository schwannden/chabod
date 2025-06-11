import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  icon?: string;
  dontShowAgain?: string;
  understood?: string;
}

interface AnnouncementDialogProps {
  isOpen: boolean;
  announcement: Announcement | null;
  onDismiss: (dontShowAgain?: boolean) => void;
}

const getIcon = (iconType?: string) => {
  switch (iconType) {
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }
};

export function AnnouncementDialog({ isOpen, announcement, onDismiss }: AnnouncementDialogProps) {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Reset dontShowAgain state when dialog closes
  useEffect(() => {
    if (!isOpen) setDontShowAgain(false);
  }, [isOpen]);

  if (!isOpen || !announcement) return null;

  const handleConfirm = () => {
    onDismiss(dontShowAgain);
    setDontShowAgain(false); // Reset for next announcement
  };

  const icon = getIcon(announcement.icon);
  const dontShowAgainText =
    announcement.dontShowAgain || t("common:dontShowAgain", "Don't show this again");
  const understoodText = announcement.understood || t("common:understood", "Understood");

  // For accessibility: generate unique ids for aria-labelledby/aria-describedby
  const dialogTitleId = `announcement-dialog-title-${announcement.id}`;
  const dialogDescId = `announcement-dialog-desc-${announcement.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={() => onDismiss(false)}>
      <DialogContent
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescId}
        data-testid="announcement-dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle id={dialogTitleId} className="flex items-center gap-2">
            {icon}
            {announcement.title}
          </DialogTitle>
          <DialogDescription
            id={dialogDescId}
            className="text-left"
            dangerouslySetInnerHTML={{ __html: announcement.message }}
          />
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            aria-checked={dontShowAgain}
            aria-label={dontShowAgainText}
            role="checkbox"
          />
          <label
            htmlFor="dontShowAgain"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {dontShowAgainText}
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full" aria-label={understoodText}>
            {understoodText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
