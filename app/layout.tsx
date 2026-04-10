import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Progress bar — Spaceship",
  description: "Thanh tiến trình ngang với tàu vũ trụ và cấu hình localStorage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="shrink-0 border-t border-slate-200/90 bg-white/85 py-3 text-center text-xs text-slate-500 backdrop-blur-sm">
          NhutVjpPro
        </footer>
      </body>
    </html>
  );
}
