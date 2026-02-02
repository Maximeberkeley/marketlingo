import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import leoSticker from "@/assets/leo-sticker.png";

// ============================================
// LEO STATE MACHINE - Simplified Version
// Very subtle breathing animation only
// ============================================

export type LeoAnim = "idle" | "thinking" | "success" | "failure" | "waving" | "celebrating" | "urgent" | "sleeping";
export type LeoVariant = "normal" | "sick" | "happy" | "sleepy";

// ============================================
// LEO CONTEXT - Global State Management
// ============================================

interface LeoContextType {
  animation: LeoAnim;
  variant: LeoVariant;
  setAnimation: (a: LeoAnim) => void;
  setVariant: (v: LeoVariant) => void;
  triggerSuccess: () => void;
  triggerFailure: () => void;
  triggerCelebrating: () => void;
}

const LeoContext = createContext<LeoContextType | undefined>(undefined);

export function LeoProvider({ children }: { children: ReactNode }) {
  const [animation, setAnimation] = useState<LeoAnim>("idle");
  const [variant, setVariant] = useState<LeoVariant>("normal");

  const triggerSuccess = useCallback(() => {
    setAnimation("success");
    setTimeout(() => setAnimation("idle"), 1500);
  }, []);

  const triggerFailure = useCallback(() => {
    setAnimation("failure");
    setTimeout(() => setAnimation("idle"), 1500);
  }, []);

  const triggerCelebrating = useCallback(() => {
    setAnimation("celebrating");
    setTimeout(() => setAnimation("idle"), 2500);
  }, []);

  return (
    <LeoContext.Provider value={{
      animation,
      variant,
      setAnimation,
      setVariant,
      triggerSuccess,
      triggerFailure,
      triggerCelebrating,
    }}>
      {children}
    </LeoContext.Provider>
  );
}

export function useLeo() {
  const context = useContext(LeoContext);
  if (!context) {
    return {
      animation: "idle" as LeoAnim,
      variant: "normal" as LeoVariant,
      setAnimation: () => {},
      setVariant: () => {},
      triggerSuccess: () => {},
      triggerFailure: () => {},
      triggerCelebrating: () => {},
    };
  }
  return context;
}

// ============================================
// LEO PUPPET - Simple subtle breathing only
// ============================================

interface LeoPuppetProps {
  size?: number;
  animation?: LeoAnim;
  variant?: LeoVariant;
  className?: string;
}

export function LeoPuppet({
  size = 180,
  animation = "idle",
  variant = "normal",
  className,
}: LeoPuppetProps) {
  const bodyCtrl = useAnimation();

  // Mood filter
  const filter =
    variant === "sick"
      ? "saturate(0.8) brightness(0.92)"
      : variant === "sleepy"
      ? "saturate(0.92) brightness(0.96)"
      : variant === "happy"
      ? "saturate(1.1) brightness(1.03)"
      : "none";

  // Very subtle breathing animation only
  useEffect(() => {
    bodyCtrl.start({
      y: [0, -1.5, 0],
      scale: [1, 1.005, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    });
  }, [bodyCtrl]);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Subtle shadow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "5%",
          width: "50%",
          height: "6%",
          background: "rgba(0,0,0,0.12)",
          borderRadius: "50%",
          filter: "blur(6px)",
          transform: "translateX(-50%)",
        }}
      />

      {/* Leo image with subtle breathing */}
      <motion.div
        animate={bodyCtrl}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          transformOrigin: "50% 75%",
          filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.15)) ${filter}`,
        }}
      >
        <img
          src={leoSticker}
          alt="Leo"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
          }}
        />
      </motion.div>
    </div>
  );
}

// ============================================
// LEO CHARACTER - Main export with size presets
// ============================================

interface LeoCharacterProps {
  size?: "sm" | "md" | "lg" | "xl";
  animation?: LeoAnim;
  variant?: LeoVariant;
  className?: string;
}

const sizeMap = {
  sm: 80,
  md: 120,
  lg: 160,
  xl: 200,
};

export function LeoCharacter({
  size = "md",
  animation = "idle",
  variant = "normal",
  className,
}: LeoCharacterProps) {
  return (
    <LeoPuppet
      size={sizeMap[size]}
      animation={animation}
      variant={variant}
      className={className}
    />
  );
}
