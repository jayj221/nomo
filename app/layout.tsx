import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nomo-phi.vercel.app";
const TAGLINE = "No more fake connections. No more talk that goes nowhere.";
const DESCRIPTION =
  "A voice-first way to meet people. Anonymous until it isn't — you talk first, faces and names come later, only if you both choose. Join the waitlist.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Nomo — talk first, reveal on your terms",
  description: DESCRIPTION,
  openGraph: {
    title: "Nomo — talk first, reveal on your terms",
    description: TAGLINE,
    url: SITE_URL,
    siteName: "Nomo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nomo — talk first, reveal on your terms",
    description: TAGLINE,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
