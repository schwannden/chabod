import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Chabod - 現代教會管理系統</h1>
        <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
          專為現代教會設計的全方位管理平台，傳承數位資產的，簡化行政工作。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base">
            <Link to="/auth">立即開始</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <a href="#features">了解更多</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
