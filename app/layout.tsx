import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const themeInitScript = `(function(){try{var k="spaceship-color-scheme";var t=localStorage.getItem(k);if(t==="light")document.documentElement.classList.remove("dark");else document.documentElement.classList.add("dark");}catch(e){document.documentElement.classList.add("dark");}})();`;

/** Toàn bộ UI dùng một monospace Google Fonts. */
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
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
      suppressHydrationWarning
      className={`${robotoMono.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-slate-100 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <Script
          id="spaceship-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="shrink-0 border-t border-slate-200/90 bg-slate-50/95 backdrop-blur-sm dark:border-slate-700/90 dark:bg-slate-900/95">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  Progress Spaceship
                </p>
                <p className="max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  A time-slot progress tracker with a spaceship UI — your data
                  stays in the browser (local storage).
                </p>
              </div>
              <div className="flex flex-col gap-2 text-left sm:text-right">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Legal
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  © {new Date().getFullYear()}{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    NhutVjpPro
                  </span>
                  .
                  <span className="text-slate-500 dark:text-slate-500">
                    {" "}
                    All rights reserved.
                  </span>
                </p>
                <p className="text-[0.65rem] text-slate-400 dark:text-slate-500">
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
