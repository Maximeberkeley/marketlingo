import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLayoutContext } from "@/contexts/LayoutContext";

interface StickyBottomCTAProps {
  children: ReactNode;
  className?: string;
  /** Add extra spacing above for gradient fade effect */
  withGradient?: boolean;
  /** Override: force modal-style padding regardless of context */
  forceModalStyle?: boolean;
  /** Override: explicitly set if bottom nav is present (otherwise reads from context) */
  hasBottomNav?: boolean;
}

/**
 * A sticky bottom CTA container that automatically handles:
 * 1. Safe area insets for iOS home indicator
 * 2. Proper spacing based on whether bottom nav is present
 * 3. Different padding for modals vs regular pages
 * 4. Optional gradient fade for scroll indication
 * 
 * USAGE:
 * - Wrap your CTA buttons in this component
 * - The component auto-detects layout context
 * - Parent scrollable content should use <StickyBottomSpacer />
 */
export function StickyBottomCTA({ 
  children, 
  className,
  withGradient = false,
  forceModalStyle = false,
  hasBottomNav: hasBottomNavOverride,
}: StickyBottomCTAProps) {
  const layoutContext = useLayoutContext();
  
  // Use override if provided, otherwise fall back to context
  const hasBottomNav = hasBottomNavOverride ?? layoutContext.hasBottomNav;
  const isInModal = forceModalStyle || layoutContext.isInModal;

  // Calculate bottom position based on context
  const getBottomOffset = () => {
    if (isInModal) {
      // Modal: just above home indicator
      return 0;
    }
    if (hasBottomNav) {
      // Page with nav: position above the nav bar
      return 'calc(64px + env(safe-area-inset-bottom, 0px))';
    }
    // Page without nav: just above home indicator
    return 0;
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-40",
        // Gradient fade effect if enabled
        withGradient && "before:absolute before:inset-x-0 before:-top-8 before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent before:pointer-events-none"
      )}
      style={{
        bottom: getBottomOffset(),
        paddingBottom: isInModal || !hasBottomNav 
          ? 'env(safe-area-inset-bottom, 0px)' 
          : 0,
      }}
    >
      <div 
        className={cn(
          "bg-background border-t border-border",
          isInModal ? "px-6 pt-4 pb-4" : "px-5 pt-4 pb-4",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface StickyBottomSpacerProps {
  className?: string;
  /** Override: explicitly set if bottom nav is present */
  hasBottomNav?: boolean;
  /** Extra height to add beyond calculated safe area */
  extraHeight?: number;
}

/**
 * Spacer component to add at the bottom of scrollable content
 * when using StickyBottomCTA to prevent content overlap
 * 
 * Automatically calculates height based on layout context
 */
export function StickyBottomSpacer({ 
  className,
  hasBottomNav: hasBottomNavOverride,
  extraHeight = 0,
}: StickyBottomSpacerProps) {
  const layoutContext = useLayoutContext();
  const hasBottomNav = hasBottomNavOverride ?? layoutContext.hasBottomNav;
  const isInModal = layoutContext.isInModal;

  // Calculate spacer height based on context
  const getSpacerHeight = () => {
    const ctaHeight = 80; // Approximate CTA container height
    const safeArea = 'env(safe-area-inset-bottom, 0px)';
    
    if (isInModal) {
      return `calc(${ctaHeight}px + ${safeArea} + ${extraHeight}px)`;
    }
    if (hasBottomNav) {
      // Account for nav bar + CTA + safe area
      return `calc(${ctaHeight + 64}px + ${safeArea} + ${extraHeight}px)`;
    }
    return `calc(${ctaHeight}px + ${safeArea} + ${extraHeight}px)`;
  };

  return (
    <div 
      className={cn("w-full flex-shrink-0", className)}
      style={{ height: getSpacerHeight() }}
      aria-hidden="true"
    />
  );
}
