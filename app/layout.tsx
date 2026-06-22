import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KBO 월페이퍼 생성기",
  description: "KBO 구단별 월간 경기 일정을 잠금화면 배경화면으로. 매일 자동 업데이트되는 URL 제공.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0d12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
