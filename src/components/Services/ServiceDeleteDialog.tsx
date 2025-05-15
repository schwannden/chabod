import React from "react";
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
import { Trash2, AlertTriangle } from "lucide-react";
import { Service } from "@/lib/services";

interface ServiceDeleteDialogProps {
  service: Service;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ServiceDeleteDialog({
  service,
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ServiceDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            確認刪除服事類型
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              您確定要刪除 <strong>{service.name}</strong> 服事類型嗎？此操作無法撤銷。
            </p>
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              <div className="flex items-start">
                <AlertTriangle className="mr-2 h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium">注意：刪除此服事類型將同時刪除以下關聯資料：</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>所有相關的服事排班</li>
                    <li>所有服事備註</li>
                    <li>所有服事角色設定</li>
                    <li>所有服事小組關聯</li>
                    <li>所有服事管理員設定</li>
                  </ul>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "處理中..." : "確認刪除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
