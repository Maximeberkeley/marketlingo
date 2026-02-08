import { MascotReaction, MascotState } from "./MascotReaction";
import { cn } from "@/lib/utils";

// ============================================
// LESSON MASCOT - Positioned for lesson slides
// ============================================

interface LessonMascotProps {
  state: MascotState;
  /** Show on lesson slides - positions at bottom-right above nav */
  variant?: "slide" | "quiz" | "floating";
  showMessage?: boolean;
  message?: string;
  className?: string;
}

/**
 * LessonMascot - A positioned mascot for lesson contexts
 * 
 * Variants:
 * - slide: Bottom-right of lesson content, above bottom nav
 * - quiz: Bottom-left, reacts to quiz answers
 * - floating: Fixed position, follows scroll
 */
export function LessonMascot({
  state,
  variant = "slide",
  showMessage = true,
  message,
  className,
}: LessonMascotProps) {
  const variantConfig = {
    slide: {
      position: "inline" as const,
      size: "md" as const,
      containerClass: "absolute bottom-4 right-4 z-40",
    },
    quiz: {
      position: "inline" as const,
      size: "lg" as const,
      containerClass: "absolute bottom-4 left-4 z-40",
    },
    floating: {
      position: "bottom-right" as const,
      size: "md" as const,
      containerClass: "",
    },
  };

  const config = variantConfig[variant];

  if (variant === "floating") {
    return (
      <MascotReaction
        state={state}
        size={config.size}
        position={config.position}
        showMessage={showMessage}
        message={message}
        className={className}
      />
    );
  }

  return (
    <div className={cn(config.containerClass, className)}>
      <MascotReaction
        state={state}
        size={config.size}
        position="inline"
        showMessage={showMessage}
        message={message}
      />
    </div>
  );
}

export default LessonMascot;
