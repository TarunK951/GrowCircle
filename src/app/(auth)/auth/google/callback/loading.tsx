import { AppLoadingScreen } from "@/components/layout/AppLoadingScreen";

/** Shown immediately on navigation to this route (before client bundle hydrates). */
export default function GoogleCallbackRouteLoading() {
  return <AppLoadingScreen />;
}
