import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Script from "next/script";
import { SiteShell } from "@/components/site/site-shell";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Novel Reading Site",
  description: "An English-first reading home for bilingual literary study.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
