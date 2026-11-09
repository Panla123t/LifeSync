import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "LifeSync - ดูแลอาหาร น้ำดื่ม และการนอนอย่างสมดุล",
  description: "เพื่อนร่วมทางสุขภาพที่ช่วยให้คุณติดตามโภชนาการ ดื่มน้ำ และการนอนหลับ พร้อมระบบ AI และเควสต์สนุกๆ ในทุกวัน",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
