import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background overflow-x-hidden w-full max-w-full">
      <main className={`overflow-x-hidden w-full ${showNav ? "safe-bottom" : ""}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
