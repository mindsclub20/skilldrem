import type { Metadata, Viewport } from "next";
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
  title: {
    default: "SKILLDREM — Smart Learning Roadmap Curator",
    template: "%s | SKILLDREM",
  },
  description:
    "Find your knowledge. Find your tools. Find your path. Discover free courses, ebooks, AI mentors, and personalized learning journeys.",
  keywords: ["learning", "courses", "free education", "roadmap", "AI mentor", "ebooks"],
  authors: [{ name: "SKILLDREM" }],
  openGraph: {
    title: "SKILLDREM — Smart Learning Roadmap Curator",
    description: "Find your knowledge. Find your tools. Find your path.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SKILLDREM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
