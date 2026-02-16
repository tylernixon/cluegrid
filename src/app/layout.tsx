import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { CookieBanner } from "@/components/ui/CookieBanner";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ibm-plex-serif",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

const siteUrl = "https://gist.ing";
const siteName = "gist";
const siteDescription =
  "A daily word puzzle where you deduce the main word from crossing clues.";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "word game",
    "daily puzzle",
    "wordle",
    "crossword",
    "word puzzle",
    "brain game",
  ],
  authors: [{ name: "gist" }],
  creator: "gist",
  metadataBase: new URL(siteUrl),

  // Open Graph (images auto-generated via opengraph-image.tsx)
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName: siteName,
    locale: "en_US",
    type: "website",
  },

  // Twitter Card (images auto-generated via twitter-image.tsx)
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    creator: "@gaborning",
  },


  // App-specific
  applicationName: siteName,
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },

  // Verification (add your own verification codes)
  // verification: {
  //   google: "your-google-verification-code",
  // },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F1EB" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0F" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexSerif.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('gist-theme');
                  // Default to dark if no preference is stored
                  if (theme !== 'light') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <AnalyticsProvider>
          {children}
          <CookieBanner />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
