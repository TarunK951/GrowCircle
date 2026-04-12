"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  selectIsAuthenticated,
} from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      const q = new URLSearchParams({ returnUrl: pathname });
      router.replace(`/login?${q.toString()}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}
