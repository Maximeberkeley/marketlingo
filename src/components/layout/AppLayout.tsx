import { ReactNode, Suspense } from "react";
import { BottomNav } from "./BottomNav";
import { Loader2 } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

/**
 * Main app layout wrapper.
 * 
 * IMPORTANT: This handles bottom nav safe area via `safe-bottom` class.
 * - Do NOT add pt-safe to children if they're wrapped in AppLayout
 * - Loading/error states within children will still get proper safe areas
 */
export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background overflow-x-hidden w-full max-w-full">
      <Suspense fallback={<AppLayoutFallback showNav={showNav} />}>
        <main className={`overflow-x-hidden w-full ${showNav ? "safe-bottom" : ""}`}>
          {children}
        </main>
      </Suspense>
      {showNav && <BottomNav />}
    </div>
  );
}

/**
 * Fallback shown during suspense - maintains safe area padding
 */
function AppLayoutFallback({ showNav }: { showNav: boolean }) {
  return (
    <div 
      className={`min-h-screen flex items-center justify-center state-container ${showNav ? "safe-bottom" : ""}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}
