import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEX 销售获益计算器",
  description: "去中心化交易所销售提成与返佣计算 Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
