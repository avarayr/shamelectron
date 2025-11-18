import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import { Banner } from "@/components/banner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Shamelectron - Electron Apps macOS Tahoe GPU Performance Tracker",
  description:
    "Track which Electron apps have fixed the major GPU performance issue on macOS Tahoe. Real-time status monitoring of Electron app compatibility with macOS 26.",
  keywords: [
    "electron",
    "macos",
    "tahoe",
    "gpu",
    "performance",
    "compatibility",
    "tracker",
    "apps",
    "macos 26",
    "electron apps",
  ],
  authors: [{ name: "normarayr", url: "https://x.com/normarayr" }],
  creator: "normarayr",
  publisher: "normarayr",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://avarayr.github.io/shamelectron/",
    title: "Shamelectron - Electron Apps macOS Tahoe GPU Performance Tracker",
    description:
      "Track which Electron apps have fixed the major GPU performance issue on macOS Tahoe. Real-time status monitoring of Electron app compatibility with macOS 26.",
    siteName: "Shamelectron",
    images: [
      {
        url: "https://avarayr.github.io/shamelectron/og-image.png",
        width: 1200,
        height: 630,
        alt: "Shamelectron - Electron Apps macOS Tahoe Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shamelectron - Electron Apps macOS Tahoe GPU Performance Tracker",
    description:
      "Track which Electron apps have fixed the major GPU performance issue on macOS Tahoe.",
    creator: "@normarayr",
    images: ["https://avarayr.github.io/shamelectron/og-image.png"],
  },
  alternates: {
    canonical: "https://avarayr.github.io/shamelectron/",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-mono antialiased`}>
        <Banner />
        {children}
      </body>
    </html>
  );
}
