
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export function ServiceOverview() {
  return (
    <section className="py-20 px-4 bg-primary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">服事管理</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            全方位的服事管理系統，協助您有效地安排和追蹤教會各項服事
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>服事團隊管理</CardTitle>
              <CardDescription>有效地組織和管理不同服事團隊</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>創建和管理不同的服事團隊</li>
                <li>追蹤服事人員的排班和出席情況</li>
                <li>安排替補及調整服事時間表</li>
                <li>自動發送提醒給即將服事的同工</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>服事排程</CardTitle>
              <CardDescription>直覺式的服事排班與時間管理</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>直觀的月曆介面安排服事活動</li>
                <li>基於角色和可用性智能推薦服事人選</li>
                <li>衝突檢測，避免同一時間多重安排</li>
                <li>追蹤服事時數和參與度</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
