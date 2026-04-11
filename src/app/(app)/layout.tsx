import { AppAuthenticatedBody } from "@/components/layout/AppAuthenticatedBody";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />
      <div className="pt-20">
        <RequireAuth>
          <AppAuthenticatedBody>{children}</AppAuthenticatedBody>
        </RequireAuth>
      </div>
    </div>
  );
}
