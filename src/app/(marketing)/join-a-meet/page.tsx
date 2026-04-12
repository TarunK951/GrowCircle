"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { PrimaryButton } from "@/components/ui/MarketingButton";
import { useSessionStore } from "@/stores/session-store";

export default function JoinAMeetPage() {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/explore");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <Container className="page-shell">
        <p className="py-16 text-sm font-medium text-neutral-900">
          Redirecting you to Explore…
        </p>
      </Container>
    );
  }

  return (
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Join"
        title="Join a meet"
        description="Browse curated circles in your city, save the ones that feel right, and confirm a mock booking — same flow you would expect from discovery-first products, without payments or SMS gates in this build."
      />
      <div className="mt-10 flex flex-wrap gap-4">
        <PrimaryButton
          href="/explore"
          label="Open explore"
          className="!min-w-[180px]"
        />
        <Link
          href="/signup"
          className="rounded-xl border border-primary/20 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          Create an account
        </Link>
      </div>
    </Container>
  );
}
