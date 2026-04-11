"use client";

import { Toaster } from "sonner";
import { MotionProviders } from "@/components/providers/MotionProviders";
import { CustomCursor } from "@/components/providers/CustomCursor";
import { UiPrefsEffects } from "@/components/providers/UiPrefsEffects";
import { CircleCatalogSync } from "@/components/providers/CircleCatalogSync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProviders>
      <CircleCatalogSync />
      <UiPrefsEffects />
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
