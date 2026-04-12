import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("h-full", "scroll-smooth", fraunces.variable, "font-sans", geist.variable)}
    >
      <body
        className="flex min-h-full flex-col bg-canvas font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
