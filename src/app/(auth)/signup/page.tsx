import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <AuthSplitLayout>
        <SignupForm />
      </AuthSplitLayout>
    </Suspense>
  );
}
