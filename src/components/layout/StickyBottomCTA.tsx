import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StickyBottomCTAProps {
  children: ReactNode;
  className?: string;
  /** Add extra spacing above for gradient fade effect */
  withGradient?: boolean;
  /** Whether this is inside a modal (uses different padding) */
  isModal?: boolean;
}

/**
 * A sticky bottom CTA container that automatically handles:
 * 1. Safe area insets for iOS home indicator
 * 2. Proper spacing so content isn't hidden under it
 * 3. Optional gradient fade for scroll indication
 * 
 * USAGE:
 * - Wrap your CTA buttons in this component
 * - The component automatically adds the correct padding
 * - Parent container should NOT add extra bottom padding
 */
export function StickyBottomCTA({ 
  children, 
  className,
  withGradient = false,
  isModal = false,
}: StickyBottomCTAProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        // Gradient fade effect if enabled
        withGradient && "before:absolute before:inset-x-0 before:-top-8 before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent before:pointer-events-none"
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div 
        className={cn(
          "bg-background border-t border-border",
          // Different padding for modals vs regular pages
          isModal ? "px-6 pt-4 pb-4" : "px-5 pt-4 pb-4",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Spacer component to add at the bottom of scrollable content
 * when using StickyBottomCTA to prevent content overlap
 * 
 * Use this instead of relying on developers to remember pb-28
 */
export function StickyBottomSpacer({ className }: { className?: string }) {
  return (
    <div 
      className={cn("w-full", className)}
      style={{
        height: 'calc(100px + env(safe-area-inset-bottom, 0px))',
      }}
    />
  );
}
