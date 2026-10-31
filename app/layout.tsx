import type { Metadata, Viewport } from "next";
import { Caveat, Zen_Maru_Gothic } from "next/font/google";
import { GameProvider } from "@/components/GameProvider";
import { NoticeToast } from "@/components/ui";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import "./globals.css";

const zen = Zen_Maru_Gothic({
  variable: "--font-zen",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travel OC · 旅行OC",
  description: "Focus on your work while your original character goes traveling. 你专心工作，你的OC去旅行。",
};

export const viewport: Viewport = {
  themeColor: "#f6f0e5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Chinese handwriting accent. Loaded at runtime so the browser fetches only the glyph slices it needs. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- CJK font is too large for next/font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap" />
      </head>
      <body className={`${zen.variable} ${caveat.variable} font-sans antialiased`}>
        <I18nProvider>
          <GameProvider>
            {children}
            <NoticeToast />
          </GameProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
