import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Cluegrid",
  description:
    "A daily word puzzle that combines Wordle-style deduction with crossword clue satisfaction.",
  openGraph: {
    title: "Cluegrid",
    description:
      "A daily word puzzle that combines Wordle-style deduction with crossword clue satisfaction.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F1EB" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1816" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-sans">
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </body>
    </html>
  );
}
