import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <AuthSplitLayout>
        <LoginForm />
      </AuthSplitLayout>
    </Suspense>
  );
}
