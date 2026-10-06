import type { Metadata } from "next";
import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import "mathlive/fonts.css";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { SITE_NAME, SITE_URL, SHARE_THUMBNAIL_PATH, absoluteSiteUrl } from "@/lib/metadata";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: "Courses, lessons, tests, and scores for Academy KH students.",
  openGraph: {
    title: SITE_NAME,
    description: "Courses, lessons, tests, and scores for Academy KH students.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: absoluteSiteUrl(SHARE_THUMBNAIL_PATH),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} learning platform`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Courses, lessons, tests, and scores for Academy KH students.",
    images: [absoluteSiteUrl(SHARE_THUMBNAIL_PATH)]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
