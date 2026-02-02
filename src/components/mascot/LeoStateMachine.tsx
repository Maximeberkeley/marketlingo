import { useEffect, useMemo, useState, createContext, useContext, ReactNode, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import leoSticker from "@/assets/leo-sticker.png";

// ============================================
// LEO STATE MACHINE - Duo-Style "Fake Rigging"
// Uses ONE PNG with clip-path masks to animate
// tail, hat, and body independently
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
// LEO PUPPET - Fake Rigging with Clip-Path
// ============================================

interface LeoPuppetProps {
  size?: number;
  animation?: LeoAnim;
  variant?: LeoVariant;
  className?: string;
  onClick?: () => void;
}

/**
 * "Poor-man's rig" using ONE PNG:
 * - Duplicate the same sticker image into layers
 * - Mask each layer with clip-path (tail/hat/body)
 * - Animate those layers independently
 * 
 * Gives 80% of Duo-like vibes with zero extra assets!
 */
export function LeoPuppet({
  size = 180,
  animation = "idle",
  variant = "normal",
  className,
  onClick,
}: LeoPuppetProps) {
  const bodyCtrl = useAnimation();
  const tailCtrl = useAnimation();
  const hatCtrl = useAnimation();

  // Natural blink scheduler (2–4s)
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let alive = true;
    const loop = () => {
      const t = 1800 + Math.random() * 2200;
      setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 110);
        loop();
      }, t);
    };
    loop();
    return () => {
      alive = false;
    };
  }, []);

  // Mood filter
  const filter =
    variant === "sick"
      ? "saturate(0.8) brightness(0.92) hue-rotate(-5deg)"
      : variant === "sleepy"
      ? "saturate(0.92) brightness(0.96)"
      : variant === "happy"
      ? "saturate(1.1) brightness(1.03)"
      : "none";

  // ---- CLIP PATH MASKS (percent coordinates) ----
  // Tail area (bottom-left fluffy tail)
  const TAIL_CLIP = "polygon(0% 50%, 0% 100%, 45% 100%, 50% 75%, 35% 55%, 15% 48%)";

  // Hat + tassel region (top)
  const HAT_CLIP = "polygon(20% 0%, 80% 0%, 90% 35%, 75% 42%, 50% 38%, 25% 42%, 10% 32%)";

  // Body - main character minus hat region for clean layering
  const BODY_CLIP = "polygon(0% 30%, 100% 30%, 100% 100%, 0% 100%)";

  const isHappyMotion = useMemo(
    () => animation === "success" || animation === "celebrating",
    [animation]
  );

  // ---- ANIMATION DRIVER ----
  useEffect(() => {
    bodyCtrl.stop();
    tailCtrl.stop();
    hatCtrl.stop();

    const run = async () => {
      // IDLE - Subtle breathing, micro movements
      if (animation === "idle") {
        bodyCtrl.start({
          y: [0, -3, 0],
          rotate: [0, -1, 0, 1, 0],
          scale: [1, 1.01, 1],
          transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        });

        tailCtrl.start({
          rotate: [0, 12, 0, -12, 0],
          transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
        });

        hatCtrl.start({
          rotate: [0, -2, 0, 2, 0],
          transition: { duration: 3.0, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      // THINKING - Head tilt, curious tail
      if (animation === "thinking") {
        bodyCtrl.start({
          rotate: [0, -5, 0, 5, 0],
          y: [0, -2, 0],
          transition: { duration: 2.0, repeat: Infinity, ease: "easeInOut" },
        });

        tailCtrl.start({
          rotate: [8, 15, 8],
          transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        });

        hatCtrl.start({
          rotate: [0, 2, 0, -2, 0],
          transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      // WAVING - Friendly wave motion
      if (animation === "waving") {
        bodyCtrl.start({
          rotate: [-3, 3, -3],
          y: [0, -2, 0],
          transition: { duration: 0.6, repeat: 5, ease: "easeInOut" },
        });

        tailCtrl.start({
          rotate: [-15, 15],
          transition: { duration: 0.3, repeat: 10, ease: "easeInOut" },
        });

        hatCtrl.start({
          rotate: [-5, 5],
          transition: { duration: 0.4, repeat: 8, ease: "easeInOut" },
        });
        return;
      }

      // URGENT - Attention-grabbing pulse
      if (animation === "urgent") {
        bodyCtrl.start({
          scale: [1, 1.06, 1],
          transition: { duration: 0.35, repeat: Infinity, ease: "easeInOut" },
        });

        tailCtrl.start({
          rotate: [-10, 10],
          transition: { duration: 0.2, repeat: Infinity, ease: "easeInOut" },
        });

        hatCtrl.start({
          rotate: [-3, 3],
          transition: { duration: 0.2, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      // FAILURE - Sad droop
      if (animation === "failure") {
        await bodyCtrl.start({
          y: [0, 6, 0],
          rotate: [0, -3, 0],
          scale: [1, 0.97, 1],
          transition: { duration: 0.7, ease: "easeInOut" },
        });
        // Return to gentle idle
        bodyCtrl.start({
          y: [0, -2, 0],
          transition: { duration: 3.0, repeat: Infinity, ease: "easeInOut" },
        });
        tailCtrl.start({
          rotate: [0, -10, -10, 0],
          transition: { duration: 1.5, ease: "easeInOut" },
        });
        hatCtrl.start({
          rotate: [0, -4, 0],
          transition: { duration: 1.0, ease: "easeInOut" },
        });
        return;
      }

      // SUCCESS - Victory jump!
      if (animation === "success") {
        await bodyCtrl.start({
          y: [0, -22, 0, -12, 0],
          scale: [1, 1.08, 0.96, 1.04, 1],
          rotate: [0, -3, 3, 0],
          transition: { duration: 0.9, times: [0, 0.25, 0.5, 0.75, 1] },
        });
        tailCtrl.start({
          rotate: [-25, 25],
          transition: { duration: 0.12, repeat: 12, ease: "easeInOut" },
        });
        hatCtrl.start({
          rotate: [-8, 8],
          transition: { duration: 0.12, repeat: 12, ease: "easeInOut" },
        });
        return;
      }

      // CELEBRATING - Party mode!
      if (animation === "celebrating") {
        bodyCtrl.start({
          y: [0, -18, 0, -18, 0],
          rotate: [-5, 5, -5, 5, 0],
          scale: [1, 1.08, 1, 1.08, 1],
          transition: { duration: 1.4, ease: "easeInOut" },
        });

        tailCtrl.start({
          rotate: [-35, 35],
          transition: { duration: 0.1, repeat: 28, ease: "easeInOut" },
        });

        hatCtrl.start({
          rotate: [-12, 12],
          transition: { duration: 0.1, repeat: 28, ease: "easeInOut" },
        });
        return;
      }

      // SLEEPING - Gentle snooze
      if (animation === "sleeping") {
        bodyCtrl.start({
          y: [0, 3, 0],
          rotate: [-2, -1, -2],
          transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        });
        tailCtrl.start({ rotate: 6, transition: { duration: 0.6 } });
        hatCtrl.start({ rotate: -3, transition: { duration: 0.6 } });
        return;
      }

      // Fallback
      bodyCtrl.start({
        y: [0, -2, 0],
        transition: { duration: 3.0, repeat: Infinity, ease: "easeInOut" },
      });
    };

    run();
  }, [animation, bodyCtrl, tailCtrl, hatCtrl]);

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    pointerEvents: "none",
  };

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
      }}
      onClick={onClick}
    >
      {/* Ground Shadow */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "2%",
          width: "60%",
          height: "8%",
          background: "rgba(0,0,0,0.18)",
          borderRadius: "50%",
          filter: "blur(8px)",
          transform: "translateX(-50%)",
        }}
        animate={{
          scaleX: isHappyMotion ? [1, 0.6, 1] : 1,
          opacity: isHappyMotion ? [0.18, 0.08, 0.18] : 0.18,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* BODY LAYER - Main character (clipped to avoid hat overlap) */}
      <motion.div
        animate={bodyCtrl}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          transformOrigin: "50% 75%",
          clipPath: BODY_CLIP,
          filter: `drop-shadow(0 6px 12px rgba(0,0,0,0.2)) ${filter}`,
          zIndex: 1,
        }}
      >
        <img src={leoSticker} alt="" draggable={false} style={imgStyle} />
      </motion.div>

      {/* TAIL LAYER - Wags independently */}
      <motion.div
        animate={tailCtrl}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          transformOrigin: "25% 70%",
          clipPath: TAIL_CLIP,
          filter,
          zIndex: 0,
        }}
      >
        <img src={leoSticker} alt="" draggable={false} style={imgStyle} />
      </motion.div>

      {/* HAT LAYER - Wobbles independently */}
      <motion.div
        animate={hatCtrl}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          transformOrigin: "50% 35%",
          clipPath: HAT_CLIP,
          filter,
          zIndex: 2,
        }}
      >
        <img src={leoSticker} alt="" draggable={false} style={imgStyle} />
      </motion.div>

      {/* BLINK OVERLAY - Fake eyelids */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        {/* Left eye lid */}
        <motion.div
          animate={{
            scaleY: blink || animation === "sleeping" ? 1 : 0,
            opacity: blink || animation === "sleeping" ? 1 : 0,
          }}
          transition={{ duration: 0.1 }}
          style={{
            position: "absolute",
            left: "36%",
            top: "38%",
            width: "11%",
            height: "5%",
            background: "#F97316",
            borderRadius: "999px",
            transformOrigin: "50% 50%",
          }}
        />
        {/* Right eye lid */}
        <motion.div
          animate={{
            scaleY: blink || animation === "sleeping" ? 1 : 0,
            opacity: blink || animation === "sleeping" ? 1 : 0,
          }}
          transition={{ duration: 0.1 }}
          style={{
            position: "absolute",
            left: "53%",
            top: "38%",
            width: "11%",
            height: "5%",
            background: "#F97316",
            borderRadius: "999px",
            transformOrigin: "50% 50%",
          }}
        />
      </div>

      {/* Subtle highlight glow on success/celebrating */}
      {isHappyMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.8, repeat: 3 }}
          style={{
            position: "absolute",
            inset: "-10%",
            background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Sick variant - thermometer + sweat */}
      {variant === "sick" && (
        <>
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute",
              right: "15%",
              top: "30%",
              fontSize: size * 0.15,
              zIndex: 4,
            }}
          >
            🌡️
          </motion.div>
          <motion.div
            animate={{ y: [0, 8], opacity: [1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              position: "absolute",
              left: "25%",
              top: "35%",
              fontSize: size * 0.1,
              zIndex: 4,
            }}
          >
            💧
          </motion.div>
        </>
      )}

      {/* Sleepy variant - Z's */}
      {(variant === "sleepy" || animation === "sleeping") && (
        <motion.div
          animate={{ y: [-5, -15], opacity: [1, 0], scale: [1, 1.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: "absolute",
            right: "10%",
            top: "15%",
            fontSize: size * 0.12,
            zIndex: 4,
          }}
        >
          💤
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// LEGACY EXPORTS - For backwards compatibility
// ============================================

// Size mapping for convenience
const sizeMap = { sm: 80, md: 120, lg: 160, xl: 200 };

interface LeoCharacterProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  animation?: LeoAnim;
  variant?: LeoVariant;
  className?: string;
  onClick?: () => void;
}

/**
 * LeoCharacter - Main exported component
 * Wrapper around LeoPuppet for easier size props
 */
export function LeoCharacter({
  size = "md",
  animation = "idle",
  variant = "normal",
  className,
  onClick,
}: LeoCharacterProps) {
  const pixelSize = typeof size === "number" ? size : sizeMap[size];
  
  return (
    <LeoPuppet
      size={pixelSize}
      animation={animation}
      variant={variant}
      className={className}
      onClick={onClick}
    />
  );
}

// Alias for the old export name
export const LeoSticker = LeoCharacter;

// ============================================
// CONNECTED LEO - Uses global state
// ============================================

interface LeoConnectedProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LeoConnected({ size = "lg", className }: LeoConnectedProps) {
  const { animation, variant, triggerSuccess } = useLeo();
  const pixelSize = sizeMap[size];
  
  return (
    <LeoPuppet
      size={pixelSize}
      animation={animation}
      variant={variant}
      onClick={triggerSuccess}
      className={className}
    />
  );
}
