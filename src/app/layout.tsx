import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ceremonies",
    template: "%s | Ceremonies",
  },
  description:
    "Open-source agile ceremony toolkit. Estimation and retros in one place. Opinionated phases, true anonymity, and action items that haunt you.",
  metadataBase: new URL("https://ceremonies.dev"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/owl-favicon-64.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ceremonies.dev",
    siteName: "Ceremonies",
    title: "Ceremonies - Agile ceremonies, done right.",
    description:
      "Open-source estimation and retros in one place. Opinionated phases, true anonymity, and action items that haunt you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ceremonies - Agile ceremonies, done right.",
    description:
      "Open-source estimation and retros in one place. Opinionated phases, true anonymity, and action items that haunt you.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  keywords: [
    "agile",
    "retro",
    "retrospective",
    "estimation",
    "planning poker",
    "scrum",
    "sprint",
    "open source",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
