"use client";

import { Toaster } from "sonner";
import { MotionProviders } from "@/components/providers/MotionProviders";
import { CustomCursor } from "@/components/providers/CustomCursor";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProviders>
      <CustomCursor />
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "bg-white/90 backdrop-blur-md border border-primary/15 text-foreground shadow-lg",
          },
        }}
      />
    </MotionProviders>
  );
}
