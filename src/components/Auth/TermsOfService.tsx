import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsOfServiceProps {
  accepted: boolean;
  onChange: (value: boolean) => void;
}

// Apostle's Creed as terms of service (required to check to sign up)
const termsOfServiceText = `
我信上帝，全能的父，創造天地的主；
我信耶穌基督，上帝的獨生子；
因聖靈成孕，為童女馬利亞所生；
在本丟彼拉多手下受難，被釘於十字架上，死了，葬了；
下到陰間，第三天從死裡復活；
後升天，坐在無所不能的父上帝右邊；
將來必從那裡降臨，審判活人死人。
我信聖靈，我信聖而公之教會；
聖徒相通；罪得赦免；
肉身復活；並且永生。阿們。
`;

export function TermsOfService({ accepted, onChange }: TermsOfServiceProps) {
  return (
    <div className="space-y-2">
      <Label>信仰告白（註冊需同意）</Label>
      <div className="max-h-40 overflow-y-auto bg-muted px-2 rounded border text-sm whitespace-pre-line">
        {termsOfServiceText}
      </div>
      <div className="flex items-start space-x-2 mt-2">
        <Checkbox
          id="terms"
          checked={accepted}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
          required
          aria-required="true"
        />
        <Label htmlFor="terms" className="cursor-pointer select-none">
          我已閱讀並同意以上信仰告白及
          <a
            href="/legal/terms-of-service.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold hover:underline"
          >
            服務條款
          </a>
        </Label>
      </div>
    </div>
  );
}
