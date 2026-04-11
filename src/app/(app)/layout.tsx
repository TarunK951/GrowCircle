import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-primary"
          >
            ConnectSphere
          </Link>
          <Link
            href="/explore"
            className="text-sm font-medium text-foreground/80 hover:text-primary"
          >
            Explore meets
          </Link>
        </div>
      </header>
      <RequireAuth>
        <div className="mx-auto max-w-6xl">
          <AppShell>{children}</AppShell>
        </div>
      </RequireAuth>
    </div>
  );
}
