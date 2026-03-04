import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";
import { forwardRef, ReactNode } from "react";

interface DuoButtonProps {
  variant?: "primary" | "secondary" | "success" | "streak" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  type?: "button" | "submit" | "reset";
}

const variantStyles = {
  primary: {
    base: "bg-primary text-white",
    shadow: "shadow-[0_4px_0_0_hsl(258_70%_45%)]",
    active: "active:shadow-[0_2px_0_0_hsl(258_70%_45%)] active:translate-y-[2px]",
  },
  secondary: {
    base: "bg-bg-1 text-text-primary border-2 border-border",
    shadow: "shadow-[0_4px_0_0_hsl(var(--border))]",
    active: "active:shadow-[0_2px_0_0_hsl(var(--border))] active:translate-y-[2px]",
  },
  success: {
    base: "bg-success text-white",
    shadow: "shadow-[0_4px_0_0_hsl(142_71%_35%)]",
    active: "active:shadow-[0_2px_0_0_hsl(142_71%_35%)] active:translate-y-[2px]",
  },
  streak: {
    base: "bg-gradient-to-b from-orange-500 to-red-500 text-white",
    shadow: "shadow-[0_4px_0_0_rgba(153,27,27,1)]",
    active: "active:shadow-[0_2px_0_0_rgba(153,27,27,1)] active:translate-y-[2px]",
  },
  ghost: {
    base: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-1",
    shadow: "",
    active: "active:bg-bg-1",
  },
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm font-semibold rounded-xl",
  md: "px-6 py-3 text-body font-bold rounded-xl",
  lg: "px-8 py-4 text-lg font-bold rounded-2xl",
  xl: "px-10 py-5 text-xl font-bold rounded-2xl",
};

export const DuoButton = forwardRef<HTMLButtonElement, DuoButtonProps>(({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
  onClick,
  children,
  type = "button",
}, ref) => {
  const styles = variantStyles[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    hapticFeedback("medium");
    onClick?.(e);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative font-semibold transition-all duration-150 no-select",
        styles.base,
        styles.shadow,
        styles.active,
        sizeStyles[size],
        fullWidth && "w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
});

DuoButton.displayName = "DuoButton";
