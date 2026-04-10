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

/** Khi deploy, đặt NEXT_PUBLIC_SITE_URL=https://ten-mien-cua-ban để og:url / ảnh chia sẻ đúng tuyệt đối. */
const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Progress bar — Spaceship",
    template: "%s · Progress Spaceship",
  },
  description:
    "Thanh tiến trình ngang với tàu vũ trụ, mốc theo khung giờ và cấu hình lưu trong trình duyệt (localStorage).",
  applicationName: "Progress Spaceship",
  authors: [{ name: "NhutVjpPro" }],
  creator: "NhutVjpPro",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "Progress Spaceship",
    title: "Progress bar — Spaceship",
    description:
      "Thanh tiến trình ngang với tàu vũ trụ và cấu hình localStorage.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Progress bar — Spaceship",
    description:
      "Thanh tiến trình ngang với tàu vũ trụ và cấu hình localStorage.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
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
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-900 antialiased">
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="shrink-0 border-t border-slate-200/90 bg-slate-50/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold tracking-tight text-slate-800">
                  Progress Spaceship
                </p>
                <p className="max-w-md text-xs leading-relaxed text-slate-600">
                  A time-slot progress tracker with a spaceship UI — your data
                  stays in the browser (local storage).
                </p>
              </div>
              <div className="flex flex-col gap-2 text-left sm:text-right">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Legal
                </p>
                <p className="text-xs text-slate-600">
                  © {new Date().getFullYear()}{" "}
                  <span className="font-medium text-slate-800">NhutVjpPro</span>.
                  <span className="text-slate-500"> All rights reserved.</span>
                </p>
                <p className="text-[0.65rem] text-slate-400">
                  Built with Next.js · React · No personal data collected on the
                  server
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
