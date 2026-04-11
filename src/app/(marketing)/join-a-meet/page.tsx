import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PrimaryButton } from "@/components/ui/MarketingButton";

export default function JoinAMeetPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Join a meet
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Browse curated circles in your city, save the ones that feel right, and
        confirm a mock booking — same flow you would expect from discovery-first
        products, without payments or SMS gates in this build.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <PrimaryButton href="/explore" label="Open explore" className="!min-w-[180px]" />
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
