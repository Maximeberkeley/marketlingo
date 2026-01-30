import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpsellModal } from "./ProUpsellModal";

interface FeatureGateProps {
  children: ReactNode;
  featureName: string;
  className?: string;
  showLockBadge?: boolean;
  /** If true, renders children but overlays the lock. If false, replaces with lock UI */
  overlayMode?: boolean;
}

export function FeatureGate({ 
  children, 
  featureName, 
  className,
  showLockBadge = true,
  overlayMode = true,
}: FeatureGateProps) {
  const { isProUser, isLoading } = useSubscription();
  const [showPromo, setShowPromo] = useState(false);

  // If pro user or loading, just render children
  if (isProUser || isLoading) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPromo(true);
  };

  return (
    <>
      <div className={cn("relative", className)} onClick={handleClick}>
        {/* Render children with overlay */}
        {overlayMode ? (
          <>
            <div className="pointer-events-none opacity-60 blur-[1px]">
              {children}
            </div>
            
            {/* Lock overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-bg-0/40 backdrop-blur-[2px] rounded-[18px] cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-purple-600/20 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">Pro Feature</p>
              <p className="text-caption text-text-secondary">Tap to unlock {featureName}</p>
            </motion.div>
          </>
        ) : (
          /* Replace mode - just show lock UI */
          <div className="flex flex-col items-center justify-center py-12 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-purple-600/20 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-accent" />
            </div>
            <p className="text-base font-medium text-text-primary mb-1">Unlock {featureName}</p>
            <p className="text-sm text-text-secondary mb-4">Available with Pro subscription</p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <Crown className="w-4 h-4" />
              Go Pro
            </div>
          </div>
        )}
        
        {/* Pro badge */}
        {showLockBadge && overlayMode && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-accent to-purple-600 text-white text-xs font-medium">
            <Crown className="w-3 h-3" />
            PRO
          </div>
        )}
      </div>

      <ProUpsellModal
        isOpen={showPromo}
        onClose={() => setShowPromo(false)}
        trigger="feature_gate"
        featureName={featureName}
      />
    </>
  );
}
