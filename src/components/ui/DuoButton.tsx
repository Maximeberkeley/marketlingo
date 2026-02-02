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
    base: "bg-gradient-to-b from-accent to-purple-600 text-white",
    shadow: "shadow-[0_4px_0_0_rgba(88,28,135,1),0_6px_20px_-4px_rgba(124,92,255,0.5)]",
    hover: "hover:shadow-[0_6px_0_0_rgba(88,28,135,1),0_8px_24px_-4px_rgba(124,92,255,0.6)]",
    active: "active:shadow-[0_2px_0_0_rgba(88,28,135,1)] active:translate-y-[2px]",
  },
  secondary: {
    base: "bg-bg-2 text-text-primary border-2 border-border",
    shadow: "shadow-[0_4px_0_0_rgba(30,41,59,1)]",
    hover: "hover:shadow-[0_6px_0_0_rgba(30,41,59,1)] hover:border-text-muted",
    active: "active:shadow-[0_2px_0_0_rgba(30,41,59,1)] active:translate-y-[2px]",
  },
  success: {
    base: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white",
    shadow: "shadow-[0_4px_0_0_rgba(4,120,87,1),0_6px_20px_-4px_rgba(16,185,129,0.5)]",
    hover: "hover:shadow-[0_6px_0_0_rgba(4,120,87,1),0_8px_24px_-4px_rgba(16,185,129,0.6)]",
    active: "active:shadow-[0_2px_0_0_rgba(4,120,87,1)] active:translate-y-[2px]",
  },
  streak: {
    base: "bg-gradient-to-b from-orange-500 to-red-500 text-white",
    shadow: "shadow-[0_4px_0_0_rgba(153,27,27,1),0_6px_20px_-4px_rgba(249,115,22,0.5)]",
    hover: "hover:shadow-[0_6px_0_0_rgba(153,27,27,1),0_8px_24px_-4px_rgba(249,115,22,0.6)]",
    active: "active:shadow-[0_2px_0_0_rgba(153,27,27,1)] active:translate-y-[2px]",
  },
  ghost: {
    base: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-1",
    shadow: "",
    hover: "",
    active: "active:bg-bg-2",
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
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative font-semibold transition-all duration-150 no-select",
        styles.base,
        styles.shadow,
        styles.hover,
        styles.active,
        sizeStyles[size],
        fullWidth && "w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Top shine */}
      <div 
        className="absolute inset-x-0 top-0 h-[40%] rounded-t-xl opacity-20"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)"
        }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
});

DuoButton.displayName = "DuoButton";
