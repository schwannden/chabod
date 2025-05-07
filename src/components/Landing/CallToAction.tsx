
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CallToAction() {
  return (
    <section className="py-20 px-4 bg-primary/10">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold mb-6">開始使用 Chabod 進行教會管理</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          加入數百個教會的行列，體驗現代化的教會管理方式
        </p>
        <Button asChild size="lg" className="text-lg px-8">
          <Link to="/auth">立即註冊</Link>
        </Button>
      </div>
    </section>
  );
}
