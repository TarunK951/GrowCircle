import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ConnectSphere — Social discovery",
    template: "%s · ConnectSphere",
  },
  description:
    "Discover curated meets, host your own, and connect with real people — ConnectSphere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full scroll-smooth ${fraunces.variable}`}>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
