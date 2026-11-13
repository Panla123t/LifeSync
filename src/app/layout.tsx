import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { LiffProvider } from "@/lib/liff/LiffContext";
import LiffHeader from "@/components/shared/LiffHeader";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
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
      suppressHydrationWarning
      className={`${promptFont.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-flash script for dark theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('lifesync_theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans selection:bg-emerald-500 selection:text-white bg-[#F8FAF8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <LiffProvider>
              <LiffHeader />
              {children}
            </LiffProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
