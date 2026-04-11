import { Suspense } from "react";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";

function AuthFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
      Loading…
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <UnifiedAuthForm />
    </Suspense>
  );
}
