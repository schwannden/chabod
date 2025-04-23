
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsOfServiceProps {
  accepted: boolean;
  onChange: (value: boolean) => void;
}

const termsOfServiceText = `
我信上帝，全能的父，創造天地的主；
我信我主耶穌基督，上帝的獨生子；
因聖靈感孕，為童貞女馬利亞所生；
在本丟彼拉多手下受難，被釘於十字架，受死，埋葬；
降在陰間，第三天從死裡復活；
升天，坐在全能父上帝的右邊；
將來必從那裡降臨，審判活人死人。
我信聖靈，我信聖而公之教會；
我信聖徒相通；我信罪得赦免；
我信身體復活；我信永生。阿們。
`;

export function TermsOfService({ accepted, onChange }: TermsOfServiceProps) {
  return (
    <div className="space-y-2">
      <Label>信仰告白（註冊需同意）</Label>
      <div className="max-h-40 overflow-y-auto bg-muted px-3 py-2 rounded border text-sm whitespace-pre-line">
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
          我已閱讀並同意以上信仰告白
        </Label>
      </div>
    </div>
  );
}
