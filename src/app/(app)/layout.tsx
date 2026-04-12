import { AppAuthenticatedBody } from "@/components/layout/AppAuthenticatedBody";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <MarketingNav />
      <div className="flex min-h-0 flex-1 flex-col pt-20">
        <RequireAuth>
          <AppAuthenticatedBody>{children}</AppAuthenticatedBody>
        </RequireAuth>
      </div>
    </div>
  );
}
