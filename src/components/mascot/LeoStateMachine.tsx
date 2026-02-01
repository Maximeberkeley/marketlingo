import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// LEO STATE MACHINE - DUO-STYLE CHARACTER SYSTEM
// ============================================

// Standardized State Machine Inputs (Duo-style contract)
export interface LeoStateInputs {
  isIdle: boolean;
  isThinking: boolean;
  isUrgent: boolean;
  isSick: boolean; // "Sick Leo" for lost streaks
  triggerSuccess: () => void;
  triggerFailure: () => void;
  triggerWave: () => void;
  triggerCelebrate: () => void;
}

// Character variant based on user behavior
type LeoVariant = "normal" | "sick" | "happy" | "sleepy";

// Animation states
type LeoAnimation = 
  | "idle" 
  | "thinking" 
  | "success" 
  | "failure" 
  | "waving" 
  | "celebrating" 
  | "urgent"
  | "sleeping";

interface LeoState {
  animation: LeoAnimation;
  variant: LeoVariant;
  message: string | null;
  isBlinking: boolean;
}

// ============================================
// LEO CONTEXT - Global state machine
// ============================================

interface LeoContextType extends LeoStateInputs {
  state: LeoState;
  setMessage: (message: string | null) => void;
  setVariant: (variant: LeoVariant) => void;
}

const LeoContext = createContext<LeoContextType | undefined>(undefined);

export function LeoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LeoState>({
    animation: "idle",
    variant: "normal",
    message: null,
    isBlinking: false,
  });

  // Natural blinking every 2-4 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setState(prev => ({ ...prev, isBlinking: true }));
      setTimeout(() => setState(prev => ({ ...prev, isBlinking: false })), 120);
    }, 2000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // State setters
  const setMessage = useCallback((message: string | null) => {
    setState(prev => ({ ...prev, message }));
  }, []);

  const setVariant = useCallback((variant: LeoVariant) => {
    setState(prev => ({ ...prev, variant }));
  }, []);

  // Trigger animations (auto-reset to idle)
  const triggerAnimation = useCallback((animation: LeoAnimation, duration = 2000) => {
    setState(prev => ({ ...prev, animation }));
    setTimeout(() => setState(prev => ({ ...prev, animation: "idle" })), duration);
  }, []);

  // State machine inputs
  const contextValue: LeoContextType = {
    state,
    setMessage,
    setVariant,
    isIdle: state.animation === "idle",
    isThinking: state.animation === "thinking",
    isUrgent: state.animation === "urgent",
    isSick: state.variant === "sick",
    triggerSuccess: () => triggerAnimation("success", 2500),
    triggerFailure: () => triggerAnimation("failure", 1800),
    triggerWave: () => triggerAnimation("waving", 2000),
    triggerCelebrate: () => triggerAnimation("celebrating", 3000),
  };

  return (
    <LeoContext.Provider value={contextValue}>
      {children}
    </LeoContext.Provider>
  );
}

export function useLeo() {
  const context = useContext(LeoContext);
  if (!context) {
    throw new Error("useLeo must be used within a LeoProvider");
  }
  return context;
}

// ============================================
// LEO CHARACTER - Cute Geometric Vector Design
// ============================================

const sizeMap = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 160,
};

interface LeoCharacterProps {
  size?: "sm" | "md" | "lg" | "xl";
  animation?: LeoAnimation;
  variant?: LeoVariant;
  message?: string;
  showMessage?: boolean;
  isBlinking?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LeoCharacter({
  size = "md",
  animation = "idle",
  variant = "normal",
  message,
  showMessage = false,
  isBlinking = false,
  onClick,
  className,
}: LeoCharacterProps) {
  const pixelSize = sizeMap[size];

  // Color variants for behavioral storytelling
  const colorVariants = {
    normal: { body: "#F97316", belly: "#FFF5EB", accent: "#EA580C" },
    sick: { body: "#D4A574", belly: "#F5E6D8", accent: "#8B7355" },
    happy: { body: "#FF8C3A", belly: "#FFFAF5", accent: "#F97316" },
    sleepy: { body: "#E8A060", belly: "#FFF8F0", accent: "#C8804A" },
  };

  const colors = colorVariants[variant];

  // Animation variants for body
  const bodyAnimations = {
    idle: {
      y: [0, -2, 0],
      scale: [1, 1.02, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
      rotate: [0, 8, 8, 0],
      y: [0, -3, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
    success: {
      y: [0, -25, 0, -15, 0],
      scale: [1, 1.15, 0.9, 1.08, 1],
      transition: { duration: 0.8, times: [0, 0.3, 0.5, 0.7, 1] },
    },
    failure: {
      y: [0, 5, 0],
      scale: [1, 0.92, 1],
      transition: { duration: 0.6 },
    },
    waving: {
      rotate: [-3, 3, -3],
      y: [0, -5, 0],
      transition: { duration: 0.8, repeat: 3, ease: "easeInOut" },
    },
    celebrating: {
      y: [0, -20, 0],
      rotate: [-5, 5, -5],
      scale: [1, 1.12, 1],
      transition: { duration: 0.5, repeat: 5, ease: "easeInOut" },
    },
    urgent: {
      scale: [1, 1.08, 1],
      transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" },
    },
    sleeping: {
      y: [0, 2, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  };

  // Ear animations
  const earAnimations = {
    idle: { rotate: [0, 3, 0, -3, 0], transition: { duration: 2.5, repeat: Infinity } },
    thinking: { rotate: [-5, 5], transition: { duration: 1.5, repeat: Infinity } },
    success: { rotate: [-15, 15], transition: { duration: 0.2, repeat: 8 } },
    failure: { rotate: [0, -20, -20, 0], transition: { duration: 0.8 } },
    waving: { rotate: [-8, 8], transition: { duration: 0.4, repeat: 5 } },
    celebrating: { rotate: [-20, 20], transition: { duration: 0.2, repeat: 15 } },
    urgent: { rotate: [-10, 10], transition: { duration: 0.3, repeat: Infinity } },
    sleeping: { rotate: [-15], transition: { duration: 0.5 } },
  };

  // Tail animations
  const tailAnimations = {
    idle: { rotate: [0, 12, 0, -12, 0], transition: { duration: 2, repeat: Infinity } },
    thinking: { rotate: [8, 15, 8], transition: { duration: 1.5, repeat: Infinity } },
    success: { rotate: [-25, 25], transition: { duration: 0.15, repeat: 12 } },
    failure: { rotate: [0, -10, -10, 0], transition: { duration: 1 } },
    waving: { rotate: [-15, 15], transition: { duration: 0.3, repeat: 6 } },
    celebrating: { rotate: [-30, 30], transition: { duration: 0.15, repeat: 20 } },
    urgent: { rotate: [-8, 8], transition: { duration: 0.25, repeat: Infinity } },
    sleeping: { rotate: [5], transition: { duration: 0.5 } },
  };

  // Pupil offset for natural look (never centered)
  const pupilOffset = animation === "thinking" ? { x: 3, y: -4 } : { x: 2, y: 1 };

  return (
    <div className={cn("relative flex items-end gap-3", className)}>
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={onClick}
        style={{ width: pixelSize, height: pixelSize }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        {/* Ground shadow */}
        <motion.div
          className="absolute left-1/2 bottom-0 w-3/5 h-3 rounded-full bg-black/20 blur-md"
          style={{ transform: "translateX(-50%) translateY(70%)" }}
          animate={{ 
            scaleX: animation === "success" || animation === "celebrating" ? [1, 0.6, 1] : 1,
            opacity: animation === "success" || animation === "celebrating" ? [0.2, 0.1, 0.2] : 0.2,
          }}
        />

        {/* Main SVG Character */}
        <motion.svg
          viewBox="0 0 100 100"
          className="relative z-10 w-full h-full"
          animate={bodyAnimations[animation]}
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}
        >
          <defs>
            {/* Radial gradients for 3D roundness */}
            <radialGradient id={`bodyGrad-${variant}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor={colors.body} />
              <stop offset="100%" stopColor={colors.accent} />
            </radialGradient>
            <radialGradient id={`bellyGrad-${variant}`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={colors.belly} />
              <stop offset="100%" stopColor="#F5DEC4" />
            </radialGradient>
            <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF8A8A" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF8A8A" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Tail */}
          <motion.ellipse
            cx="82" cy="68"
            rx="12" ry="20"
            fill={`url(#bodyGrad-${variant})`}
            stroke={colors.accent}
            strokeWidth="1.5"
            transform="rotate(25, 82, 68)"
            animate={tailAnimations[animation]}
            style={{ originX: "82px", originY: "68px" }}
          />
          <ellipse cx="86" cy="56" rx="6" ry="10" fill={colors.belly} transform="rotate(25, 86, 56)" />

          {/* Body - round and cute */}
          <ellipse 
            cx="50" cy="72" 
            rx="28" ry="24" 
            fill={`url(#bodyGrad-${variant})`}
            stroke={colors.accent}
            strokeWidth="2"
          />

          {/* Belly */}
          <ellipse cx="50" cy="76" rx="18" ry="16" fill={`url(#bellyGrad-${variant})`} />

          {/* Feet */}
          <ellipse cx="35" cy="92" rx="10" ry="6" fill={`url(#bodyGrad-${variant})`} stroke={colors.accent} strokeWidth="1.5" />
          <ellipse cx="65" cy="92" rx="10" ry="6" fill={`url(#bodyGrad-${variant})`} stroke={colors.accent} strokeWidth="1.5" />

          {/* Arms/Paws */}
          <ellipse cx="25" cy="70" rx="8" ry="6" fill={`url(#bodyGrad-${variant})`} stroke={colors.accent} strokeWidth="1.5" />
          <motion.ellipse 
            cx="75" cy="68" 
            rx="8" ry="6" 
            fill={`url(#bodyGrad-${variant})`}
            stroke={colors.accent}
            strokeWidth="1.5"
            animate={animation === "waving" ? { 
              cx: [75, 80, 75],
              cy: [68, 58, 68],
              rotate: [0, -30, 0],
            } : {}}
            transition={{ duration: 0.4, repeat: animation === "waving" ? 5 : 0 }}
          />

          {/* Head - large and round for cuteness */}
          <circle 
            cx="50" cy="42" 
            r="30" 
            fill={`url(#bodyGrad-${variant})`}
            stroke={colors.accent}
            strokeWidth="2"
          />

          {/* Cheek fluffs */}
          <ellipse cx="22" cy="45" rx="8" ry="6" fill={`url(#bodyGrad-${variant})`} />
          <ellipse cx="78" cy="45" rx="8" ry="6" fill={`url(#bodyGrad-${variant})`} />

          {/* Left Ear */}
          <motion.g animate={earAnimations[animation]} style={{ originX: "35px", originY: "22px" }}>
            <ellipse cx="35" cy="15" rx="8" ry="16" fill={`url(#bodyGrad-${variant})`} stroke={colors.accent} strokeWidth="1.5" transform="rotate(-15, 35, 15)" />
            <ellipse cx="35" cy="16" rx="4" ry="10" fill="#FFCACA" transform="rotate(-15, 35, 16)" opacity="0.7" />
          </motion.g>

          {/* Right Ear */}
          <motion.g animate={earAnimations[animation]} style={{ originX: "65px", originY: "22px" }}>
            <ellipse cx="65" cy="15" rx="8" ry="16" fill={`url(#bodyGrad-${variant})`} stroke={colors.accent} strokeWidth="1.5" transform="rotate(15, 65, 15)" />
            <ellipse cx="65" cy="16" rx="4" ry="10" fill="#FFCACA" transform="rotate(15, 65, 16)" opacity="0.7" />
          </motion.g>

          {/* Snout */}
          <ellipse cx="50" cy="50" rx="14" ry="10" fill={colors.belly} />

          {/* Eyes - large and expressive */}
          <ellipse cx="38" cy="40" rx="9" ry={isBlinking || animation === "sleeping" ? 1.5 : 8} fill="white" stroke="#333" strokeWidth="1" />
          <ellipse cx="62" cy="40" rx="9" ry={isBlinking || animation === "sleeping" ? 1.5 : 8} fill="white" stroke="#333" strokeWidth="1" />

          {/* Pupils - OFFSET for natural look (Duo principle) */}
          {!isBlinking && animation !== "sleeping" && (
            <>
              <circle cx={38 + pupilOffset.x} cy={40 + pupilOffset.y} r="5" fill="#1A1A2E" />
              <circle cx={38 + pupilOffset.x + 2} cy={40 + pupilOffset.y - 2} r="2" fill="white" />
              <circle cx={62 + pupilOffset.x} cy={40 + pupilOffset.y} r="5" fill="#1A1A2E" />
              <circle cx={62 + pupilOffset.x + 2} cy={40 + pupilOffset.y - 2} r="2" fill="white" />
            </>
          )}

          {/* Eyebrows for expressions */}
          {animation === "thinking" && (
            <>
              <ellipse cx="38" cy="32" rx="7" ry="2" fill={colors.accent} transform="rotate(-8, 38, 32)" />
              <ellipse cx="62" cy="32" rx="7" ry="2" fill={colors.accent} transform="rotate(8, 62, 32)" />
            </>
          )}
          {animation === "failure" && (
            <>
              <path d="M31,33 Q38,30 45,33" stroke={colors.accent} strokeWidth="2" fill="none" />
              <path d="M55,33 Q62,30 69,33" stroke={colors.accent} strokeWidth="2" fill="none" />
            </>
          )}

          {/* Blush cheeks */}
          <ellipse cx="26" cy="48" rx="6" ry="4" fill="url(#blushGrad)" />
          <ellipse cx="74" cy="48" rx="6" ry="4" fill="url(#blushGrad)" />

          {/* Nose */}
          <ellipse cx="50" cy="48" rx="5" ry="4" fill="#1A1A2E" />
          <ellipse cx="48" cy="46" rx="2" ry="1.5" fill="white" opacity="0.4" />

          {/* Mouth */}
          <path
            d={
              animation === "success" || animation === "celebrating"
                ? "M42,55 Q50,65 58,55" // Big smile
                : animation === "failure"
                ? "M44,58 Q50,54 56,58" // Frown
                : animation === "sleeping"
                ? "M46,56 Q50,58 54,56" // Peaceful
                : "M44,55 Q50,60 56,55" // Normal smile
            }
            stroke="#5C4033"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Graduation Hat */}
          <g>
            <path d="M25,22 L50,12 L75,22 L50,30 Z" fill="#1E3A5F" />
            <ellipse cx="50" cy="24" rx="14" ry="8" fill="#152238" />
            <circle cx="50" cy="18" r="3" fill="#FFD700" />
            
            {/* Tassel */}
            <motion.g
              animate={{ rotate: animation === "celebrating" ? [-20, 20] : [-5, 5] }}
              transition={{ 
                duration: animation === "celebrating" ? 0.15 : 1.5, 
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "50px", originY: "18px" }}
            >
              <path d="M50,18 Q62,25 68,35" stroke="#FFD700" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="68" cy="38" rx="4" ry="6" fill="#FFD700" />
              <line x1="65" y1="44" x2="64" y2="50" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="68" y1="44" x2="68" y2="51" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="71" y1="44" x2="72" y2="50" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>
          </g>

          {/* Sick variant extras */}
          {variant === "sick" && (
            <>
              {/* Thermometer */}
              <rect x="70" y="48" width="3" height="14" rx="1.5" fill="#FF6B6B" transform="rotate(30, 71.5, 55)" />
              <circle cx="72" cy="60" r="3" fill="#FF6B6B" transform="rotate(30, 71.5, 55)" />
              {/* Sweat drop */}
              <path d="M78,35 Q80,30 82,35 Q80,40 78,35" fill="#87CEEB" />
            </>
          )}

          {/* Sleeping Z's */}
          {animation === "sleeping" && (
            <g fill="#6366F1" fontSize="8" fontWeight="bold">
              <text x="70" y="25" opacity="0.8">z</text>
              <text x="76" y="18" opacity="0.6">z</text>
              <text x="82" y="12" opacity="0.4">z</text>
            </g>
          )}
        </motion.svg>
      </motion.div>

      {/* Speech Bubble */}
      <AnimatePresence>
        {showMessage && message && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative bg-bg-2 rounded-2xl rounded-bl-md px-4 py-3 border border-border shadow-lg max-w-[180px]"
          >
            <div className="absolute left-0 bottom-3 w-3 h-3 bg-bg-2 border-l border-b border-border transform -translate-x-1.5 rotate-45" />
            <p className="text-sm text-text-primary font-medium leading-snug">{message}</p>
            <p className="text-xs text-accent mt-1">— Leo</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// LEO INTERACTIVE - With tap behavior
// ============================================

interface LeoInteractiveProps {
  size?: "sm" | "md" | "lg" | "xl";
  initialMessage?: string;
  variant?: LeoVariant;
  onTap?: () => void;
}

export function LeoInteractive({
  size = "lg",
  initialMessage,
  variant = "normal",
  onTap,
}: LeoInteractiveProps) {
  const [animation, setAnimation] = useState<LeoAnimation>("idle");
  const [message, setMessage] = useState(initialMessage);
  const [tapCount, setTapCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // Natural blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    }, 2500 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);

  const tapResponses: { animation: LeoAnimation; message: string }[] = [
    { animation: "success", message: "Wheee! 🎉" },
    { animation: "waving", message: "Hey there! 👋" },
    { animation: "celebrating", message: "Let's go! 🚀" },
    { animation: "thinking", message: "Hmm... 🤔" },
  ];

  const handleTap = () => {
    const response = tapResponses[tapCount % tapResponses.length];
    setAnimation(response.animation);
    setMessage(response.message);
    setTapCount(prev => prev + 1);

    setTimeout(() => {
      setAnimation("idle");
      setMessage(initialMessage);
    }, 2500);

    onTap?.();
  };

  return (
    <LeoCharacter
      size={size}
      animation={animation}
      variant={variant}
      message={message}
      showMessage={!!message}
      isBlinking={isBlinking}
      onClick={handleTap}
    />
  );
}

// ============================================
// CONNECTED LEO - Uses global state machine
// ============================================

export function LeoConnected({
  size = "lg",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const { state, triggerSuccess } = useLeo();

  return (
    <LeoCharacter
      size={size}
      animation={state.animation}
      variant={state.variant}
      message={state.message ?? undefined}
      showMessage={!!state.message}
      isBlinking={state.isBlinking}
      onClick={triggerSuccess}
      className={className}
    />
  );
}

export default LeoCharacter;
