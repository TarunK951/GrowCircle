import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <AuthSplitLayout>
      <SignupForm />
    </AuthSplitLayout>
  );
}
