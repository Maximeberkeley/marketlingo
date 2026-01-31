import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
      <main className={`overflow-x-hidden ${showNav ? "safe-bottom" : ""}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
