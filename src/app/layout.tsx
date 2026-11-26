import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Snow } from "@/components/snow";
import { tenant } from "@/lib/tenants";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Growth Hub · Social Lab",
  description: "Organic and paid performance across every account, at a glance.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={
        {
          "--accent-rgb": tenant().accent ?? "255, 255, 255",
          "--tint-rgb": tenant().tint ?? "7, 8, 10",
          ...(tenant().glow === "outline" && {
            "--outline-alpha": "0.55",
            "--glow-alpha": "0.07",
            "--glow-hover-alpha": "0.16",
            "--text-glow-alpha": "0.12",
            "--line-glow-alpha": "0.18",
          }),
          ...(tenant().theme && {
            "--bg": tenant().theme!.bg,
            "--surface": tenant().theme!.surface,
            "--line": tenant().theme!.line,
            "--soft": tenant().theme!.soft,
          }),
        } as React.CSSProperties
      }>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Snow />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
