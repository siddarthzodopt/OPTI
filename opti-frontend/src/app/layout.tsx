import type { Metadata } from "next";
import ThemeProvider from "./components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPTI - AI-Powered Sales & Marketing Assistant",
  description:
    "Your intelligent assistant for email campaigns, WhatsApp messages, sales strategies, and lead management.",
  keywords: [
    "AI",
    "Sales",
    "Marketing",
    "Email Campaign",
    "Lead Management",
    "OPTI",
    "WhatsApp",
    "Sales Strategy",
  ],
  authors: [{ name: "OPTI Team" }],
  creator: "OPTI Team",
  publisher: "OPTI",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "OPTI - AI-Powered Sales & Marketing Assistant",
    description:
      "Your intelligent assistant for email campaigns, WhatsApp messages, sales strategies, and lead management.",
    type: "website",
    locale: "en_US",
    siteName: "OPTI",
  },
  twitter: {
    card: "summary_large_image",
    title: "OPTI - AI-Powered Sales & Marketing Assistant",
    description:
      "Your intelligent assistant for email campaigns, WhatsApp messages, sales strategies, and lead management.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#667eea" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}