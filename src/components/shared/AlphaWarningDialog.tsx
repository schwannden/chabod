import { useState } from "react";
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
import { AlertTriangle } from "lucide-react";

interface AlphaWarningDialogProps {
  isOpen: boolean;
  onDismiss: (dontShowAgain?: boolean) => void;
}

export function AlphaWarningDialog({ isOpen, onDismiss }: AlphaWarningDialogProps) {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    onDismiss(dontShowAgain);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onDismiss(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("alphaWarning.title")}
          </DialogTitle>
          <DialogDescription className="text-left">{t("alphaWarning.message")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label
            htmlFor="dontShowAgain"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t("alphaWarning.dontShowAgain")}
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">
            {t("alphaWarning.understood")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
