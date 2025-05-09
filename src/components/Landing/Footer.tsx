export function Footer() {
  return (
    <footer className="bg-background border-t py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">Chabod</h3>
            <p className="text-muted-foreground">
              專為現代教會設計的全方位管理平台，傳承數位資產的，簡化行政工作。
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4">連結</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary">
                  功能
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-primary">
                  價格
                </a>
              </li>
              <li>
                <a
                  href="/legal/terms-of-service.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">聯絡我們</h3>
            <p className="text-muted-foreground">
              有任何問題或建議？
              <br />
              請寄信至{" "}
              <a href="mailto:support@fruitful-tools.com" className="text-primary hover:underline">
                support@fruitful-tools.com
              </a>
            </p>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © 2025 Chabod Limited. 保留所有權利。
        </div>
      </div>
    </footer>
  );
}
