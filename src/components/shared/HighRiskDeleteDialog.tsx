import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface HighRiskDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmationText: string;
  confirmationPlaceholder?: string;
  destructiveActionLabel?: string;
  cancelActionLabel?: string;
  isLoading?: boolean;
}

export function HighRiskDeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmationText,
  confirmationPlaceholder = "請輸入確認文字",
  destructiveActionLabel = "永久刪除",
  cancelActionLabel = "取消",
  isLoading = false,
}: HighRiskDeleteDialogProps) {
  const [inputText, setInputText] = useState("");
  const isConfirmDisabled = inputText !== confirmationText;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>{description}</p>
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">警告：此操作無法撤銷！</p>
              <p>刪除後，所有相關資料將永久消失且無法恢復。</p>
            </div>
            <div className="pt-2">
              <p className="mb-2 text-sm font-medium">
                請輸入 <span className="font-bold">{confirmationText}</span> 以確認刪除：
              </p>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={confirmationPlaceholder}
                className="bg-background"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelActionLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isConfirmDisabled || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "處理中..." : destructiveActionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
