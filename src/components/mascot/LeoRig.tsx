import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// LEO RIG SYSTEM - Pixel-Perfect Bone-Based Character
// Matches the reference sticker: fluffy orange fox with
// green eyes, cream chest, dark paws, graduation cap
// ============================================

export type LeoEmotion = "idle" | "happy" | "mischievous" | "celebrate" | "sad" | "thinking" | "waving";

// Context for global Leo state
interface LeoContextType {
  emotion: LeoEmotion;
  setEmotion: (e: LeoEmotion) => void;
  triggerEmotion: (e: LeoEmotion, duration?: number) => void;
}

const LeoContext = createContext<LeoContextType | undefined>(undefined);

export function LeoProvider({ children }: { children: ReactNode }) {
  const [emotion, setEmotion] = useState<LeoEmotion>("idle");

  const triggerEmotion = useCallback((e: LeoEmotion, duration = 2500) => {
    setEmotion(e);
    if (e !== "idle") {
      setTimeout(() => setEmotion("idle"), duration);
    }
  }, []);

  return (
    <LeoContext.Provider value={{ emotion, setEmotion, triggerEmotion }}>
      {children}
    </LeoContext.Provider>
  );
}

export function useLeoEmotion() {
  const context = useContext(LeoContext);
  if (!context) {
    return { emotion: "idle" as LeoEmotion, setEmotion: () => {}, triggerEmotion: () => {} };
  }
  return context;
}

// Size mapping
const sizeMap = { sm: 80, md: 120, lg: 160, xl: 200 };

interface LeoRigProps {
  size?: "sm" | "md" | "lg" | "xl";
  emotion?: LeoEmotion;
  message?: string;
  showMessage?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================
// THE LEO CHARACTER - Matching reference exactly
// Features: Fluffy orange fur, cream chest/cheeks,
// green eyes, dark brown paws, navy grad cap
// ============================================

export function LeoRig({
  size = "md",
  emotion = "idle",
  message,
  showMessage = false,
  onClick,
  className,
}: LeoRigProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const pixelSize = sizeMap[size];

  // Natural blinking every 2-4 seconds
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    };
    const interval = setInterval(blink, 2500 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);

  // Body breathing animation (micro-motion)
  const bodyAnimation = {
    idle: {
      y: [0, -2, 0],
      scale: [1, 1.008, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    happy: {
      y: [0, -4, 0],
      scale: [1, 1.03, 1],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
    },
    mischievous: {
      rotate: [0, 2, 0, -2, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
    celebrate: {
      y: [0, -15, 0],
      scale: [1, 1.08, 0.95, 1],
      transition: { duration: 0.5, repeat: 4, ease: "easeOut" },
    },
    sad: {
      y: [0, 2, 0],
      scale: [1, 0.97, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
      rotate: [0, 5, 5, 0],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
    waving: {
      rotate: [-2, 2, -2],
      transition: { duration: 0.6, repeat: 5, ease: "easeInOut" },
    },
  };

  // Ear animations
  const leftEarAnimation = {
    idle: { rotate: [0, 3, 0], transition: { duration: 2.5, repeat: Infinity } },
    happy: { rotate: [-5, 5], transition: { duration: 0.4, repeat: Infinity } },
    mischievous: { rotate: [5, 10, 5], transition: { duration: 1.5, repeat: Infinity } },
    celebrate: { rotate: [-15, 15], transition: { duration: 0.2, repeat: 20 } },
    sad: { rotate: [-20, -15, -20], transition: { duration: 2, repeat: Infinity } },
    thinking: { rotate: [-5, 0, -5], transition: { duration: 2, repeat: Infinity } },
    waving: { rotate: [-8, 8], transition: { duration: 0.3, repeat: 10 } },
  };

  const rightEarAnimation = {
    idle: { rotate: [0, -3, 0], transition: { duration: 2.5, repeat: Infinity, delay: 0.3 } },
    happy: { rotate: [5, -5], transition: { duration: 0.4, repeat: Infinity } },
    mischievous: { rotate: [-5, -10, -5], transition: { duration: 1.5, repeat: Infinity } },
    celebrate: { rotate: [15, -15], transition: { duration: 0.2, repeat: 20 } },
    sad: { rotate: [20, 15, 20], transition: { duration: 2, repeat: Infinity } },
    thinking: { rotate: [5, 0, 5], transition: { duration: 2, repeat: Infinity } },
    waving: { rotate: [8, -8], transition: { duration: 0.3, repeat: 10 } },
  };

  // Tail animations - base and tip separate for fluidity
  const tailAnimation = {
    idle: { rotate: [0, 8, 0, -8, 0], transition: { duration: 2.5, repeat: Infinity } },
    happy: { rotate: [-20, 20], transition: { duration: 0.25, repeat: Infinity } },
    mischievous: { rotate: [5, 15, 5], transition: { duration: 2, repeat: Infinity } },
    celebrate: { rotate: [-35, 35], transition: { duration: 0.15, repeat: 30 } },
    sad: { rotate: [-5, 0, -5], transition: { duration: 3, repeat: Infinity } },
    thinking: { rotate: [10, 15, 10], transition: { duration: 2, repeat: Infinity } },
    waving: { rotate: [-15, 15], transition: { duration: 0.3, repeat: 10 } },
  };

  // Mouth shape per emotion
  const getMouthPath = () => {
    switch (emotion) {
      case "happy":
      case "celebrate":
        return "M38,58 Q50,68 62,58"; // Big open smile
      case "mischievous":
        return "M40,56 Q52,62 58,54"; // Sideways smirk
      case "sad":
        return "M42,60 Q50,55 58,60"; // Frown
      case "thinking":
        return "M44,57 Q50,55 52,57"; // Small pursed
      default:
        return "M40,56 Q50,63 60,56"; // Gentle smile
    }
  };

  // Pupil position (never centered - Duo principle)
  const getPupilOffset = () => {
    switch (emotion) {
      case "thinking": return { x: 3, y: -3 };
      case "mischievous": return { x: 4, y: 1 };
      case "sad": return { x: 0, y: 3 };
      default: return { x: 2, y: 1 };
    }
  };

  const pupilOffset = getPupilOffset();

  return (
    <div className={cn("relative flex items-end gap-3", className)}>
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={onClick}
        style={{ width: pixelSize, height: pixelSize }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        {/* Ground shadow */}
        <motion.div
          className="absolute left-1/2 bottom-0 w-3/5 h-2 rounded-full bg-black/15 blur-md"
          style={{ transform: "translateX(-50%) translateY(80%)" }}
          animate={{
            scaleX: emotion === "celebrate" ? [1, 0.5, 1] : 1,
            opacity: emotion === "celebrate" ? [0.15, 0.08, 0.15] : 0.15,
          }}
        />

        {/* Main SVG - Layered Rig */}
        <motion.svg
          viewBox="0 0 100 100"
          className="relative z-10 w-full h-full overflow-visible"
          animate={bodyAnimation[emotion]}
          style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))" }}
        >
          <defs>
            {/* Orange fur gradient - rich warm orange */}
            <radialGradient id="furOrange" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FF8C42" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </radialGradient>
            
            {/* Cream belly/chest gradient */}
            <radialGradient id="furCream" cx="50%" cy="25%" r="80%">
              <stop offset="0%" stopColor="#FFFBF5" />
              <stop offset="60%" stopColor="#FEF3E2" />
              <stop offset="100%" stopColor="#F5DFC8" />
            </radialGradient>
            
            {/* Dark brown paws */}
            <radialGradient id="pawBrown" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#5D4037" />
              <stop offset="100%" stopColor="#3E2723" />
            </radialGradient>
            
            {/* Navy graduation cap */}
            <linearGradient id="capNavy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D3A5C" />
              <stop offset="100%" stopColor="#1A2744" />
            </linearGradient>
            
            {/* Gold tassel */}
            <linearGradient id="tasselGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD93D" />
              <stop offset="100%" stopColor="#D4A20A" />
            </linearGradient>
            
            {/* Green eyes */}
            <radialGradient id="eyeGreen" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#22C55E" />
            </radialGradient>
            
            {/* Cheek blush */}
            <radialGradient id="blush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9E9E" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF9E9E" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* === TAIL (behind body) === */}
          <motion.g
            animate={tailAnimation[emotion]}
            style={{ originX: "78px", originY: "70px" }}
          >
            {/* Tail base - fluffy orange */}
            <ellipse cx="82" cy="62" rx="14" ry="24" fill="url(#furOrange)" transform="rotate(30, 82, 62)" />
            {/* Tail tip - cream */}
            <ellipse cx="88" cy="48" rx="8" ry="14" fill="url(#furCream)" transform="rotate(30, 88, 48)" />
          </motion.g>

          {/* === BODY === */}
          <ellipse cx="50" cy="74" rx="26" ry="22" fill="url(#furOrange)" />
          
          {/* Cream chest/belly */}
          <ellipse cx="50" cy="78" rx="16" ry="14" fill="url(#furCream)" />

          {/* === FRONT PAWS (dark brown) === */}
          <ellipse cx="34" cy="88" rx="8" ry="5" fill="url(#pawBrown)" />
          <ellipse cx="66" cy="88" rx="8" ry="5" fill="url(#pawBrown)" />
          
          {/* Lower legs */}
          <ellipse cx="36" cy="82" rx="6" ry="8" fill="url(#furOrange)" />
          <ellipse cx="64" cy="82" rx="6" ry="8" fill="url(#furOrange)" />

          {/* === HEAD === */}
          <circle cx="50" cy="42" r="28" fill="url(#furOrange)" />
          
          {/* Cheek fluffs - cream colored like reference */}
          <ellipse cx="24" cy="46" rx="10" ry="8" fill="url(#furCream)" />
          <ellipse cx="76" cy="46" rx="10" ry="8" fill="url(#furCream)" />
          
          {/* Orange fur tuft on top of head */}
          <ellipse cx="50" cy="18" rx="8" ry="6" fill="url(#furOrange)" />
          <ellipse cx="45" cy="20" rx="5" ry="4" fill="#FF9F4A" />
          <ellipse cx="55" cy="20" rx="5" ry="4" fill="#FF9F4A" />

          {/* === LEFT EAR === */}
          <motion.g
            animate={leftEarAnimation[emotion]}
            style={{ originX: "32px", originY: "28px" }}
          >
            <ellipse cx="30" cy="18" rx="9" ry="16" fill="url(#furOrange)" transform="rotate(-20, 30, 18)" />
            {/* Inner ear - cream */}
            <ellipse cx="30" cy="20" rx="5" ry="10" fill="url(#furCream)" transform="rotate(-20, 30, 20)" />
          </motion.g>

          {/* === RIGHT EAR === */}
          <motion.g
            animate={rightEarAnimation[emotion]}
            style={{ originX: "68px", originY: "28px" }}
          >
            <ellipse cx="70" cy="18" rx="9" ry="16" fill="url(#furOrange)" transform="rotate(20, 70, 18)" />
            {/* Inner ear - cream */}
            <ellipse cx="70" cy="20" rx="5" ry="10" fill="url(#furCream)" transform="rotate(20, 70, 20)" />
          </motion.g>

          {/* === SNOUT/MUZZLE === */}
          <ellipse cx="50" cy="52" rx="12" ry="9" fill="url(#furCream)" />

          {/* === EYES - Green with white highlight === */}
          {/* Left eye */}
          <ellipse 
            cx="38" cy="42" 
            rx="8" ry={isBlinking || emotion === "sad" ? 2 : 7} 
            fill="white" 
          />
          {!isBlinking && emotion !== "sad" && (
            <>
              <ellipse cx={38 + pupilOffset.x} cy={42 + pupilOffset.y} rx="5" ry="5" fill="url(#eyeGreen)" />
              <circle cx={38 + pupilOffset.x} cy={42 + pupilOffset.y} r="3" fill="#1A1A2E" />
              <circle cx={36 + pupilOffset.x} cy={40 + pupilOffset.y} r="1.5" fill="white" />
            </>
          )}
          
          {/* Right eye */}
          <ellipse 
            cx="62" cy="42" 
            rx="8" ry={isBlinking || emotion === "sad" ? 2 : 7} 
            fill="white" 
          />
          {!isBlinking && emotion !== "sad" && (
            <>
              <ellipse cx={62 + pupilOffset.x} cy={42 + pupilOffset.y} rx="5" ry="5" fill="url(#eyeGreen)" />
              <circle cx={62 + pupilOffset.x} cy={42 + pupilOffset.y} r="3" fill="#1A1A2E" />
              <circle cx={60 + pupilOffset.x} cy={40 + pupilOffset.y} r="1.5" fill="white" />
            </>
          )}

          {/* Eyebrows - for mischievous tilt */}
          {emotion === "mischievous" && (
            <>
              <ellipse cx="38" cy="34" rx="6" ry="1.5" fill="#EA580C" transform="rotate(-10, 38, 34)" />
              <ellipse cx="62" cy="35" rx="6" ry="1.5" fill="#EA580C" transform="rotate(5, 62, 35)" />
            </>
          )}
          {emotion === "sad" && (
            <>
              <ellipse cx="38" cy="36" rx="6" ry="1.5" fill="#EA580C" transform="rotate(15, 38, 36)" />
              <ellipse cx="62" cy="36" rx="6" ry="1.5" fill="#EA580C" transform="rotate(-15, 62, 36)" />
            </>
          )}

          {/* Cheek blush */}
          <ellipse cx="26" cy="50" rx="5" ry="3" fill="url(#blush)" />
          <ellipse cx="74" cy="50" rx="5" ry="3" fill="url(#blush)" />

          {/* === NOSE === */}
          <ellipse cx="50" cy="50" rx="4" ry="3" fill="#3E2723" />
          <ellipse cx="49" cy="49" rx="1.5" ry="1" fill="white" opacity="0.4" />

          {/* === MOUTH === */}
          <motion.path
            d={getMouthPath()}
            stroke="#5D4037"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Smile details for happy/celebrate */}
          {(emotion === "happy" || emotion === "celebrate") && (
            <ellipse cx="50" cy="62" rx="6" ry="3" fill="#FF6B6B" opacity="0.8" />
          )}

          {/* === GRADUATION CAP === */}
          <g>
            {/* Mortarboard */}
            <path d="M22,20 L50,10 L78,20 L50,28 Z" fill="url(#capNavy)" />
            
            {/* Cap base (on head) */}
            <ellipse cx="50" cy="22" rx="14" ry="7" fill="#1A2744" />
            
            {/* Button on top */}
            <circle cx="50" cy="15" r="3" fill="url(#tasselGold)" />
            
            {/* Tassel */}
            <motion.g
              animate={{
                rotate: emotion === "celebrate" ? [-25, 25] : emotion === "happy" ? [-10, 10] : [-4, 4],
              }}
              transition={{
                duration: emotion === "celebrate" ? 0.12 : emotion === "happy" ? 0.5 : 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "50px", originY: "15px" }}
            >
              <path d="M50,15 Q65,22 72,32" stroke="url(#tasselGold)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Tassel end */}
              <ellipse cx="72" cy="35" rx="4" ry="6" fill="url(#tasselGold)" />
              {/* Fringe */}
              <line x1="69" y1="41" x2="68" y2="47" stroke="#D4A20A" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="72" y1="41" x2="72" y2="48" stroke="#D4A20A" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="75" y1="41" x2="76" y2="47" stroke="#D4A20A" strokeWidth="1.2" strokeLinecap="round" />
            </motion.g>
          </g>
        </motion.svg>
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence>
        {showMessage && message && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
// INTERACTIVE LEO - Tap to cycle emotions
// ============================================

interface LeoInteractiveProps {
  size?: "sm" | "md" | "lg" | "xl";
  initialMessage?: string;
  onTap?: () => void;
  className?: string;
}

export function LeoInteractive({
  size = "lg",
  initialMessage,
  onTap,
  className,
}: LeoInteractiveProps) {
  const [emotion, setEmotion] = useState<LeoEmotion>("idle");
  const [message, setMessage] = useState(initialMessage);
  const [tapCount, setTapCount] = useState(0);

  const emotions: LeoEmotion[] = ["happy", "celebrate", "waving", "mischievous", "thinking"];
  const messages = [
    "Hey there! 🦊",
    "Woohoo! 🎉",
    "Hi friend! 👋",
    "Hehe... 😏",
    "Hmm... 🤔",
  ];

  const handleTap = () => {
    const idx = tapCount % emotions.length;
    setEmotion(emotions[idx]);
    setMessage(messages[idx]);
    setTapCount(prev => prev + 1);

    setTimeout(() => {
      setEmotion("idle");
      setMessage(initialMessage);
    }, 2500);

    onTap?.();
  };

  return (
    <LeoRig
      size={size}
      emotion={emotion}
      message={message}
      showMessage={!!message}
      onClick={handleTap}
      className={className}
    />
  );
}

// ============================================
// LEO COMPANION - For roadmap/progress pages
// ============================================

interface LeoCompanionProps {
  size?: "sm" | "md" | "lg";
  position?: "left" | "right";
  emotion?: LeoEmotion;
  message?: string;
  className?: string;
}

export function LeoCompanion({
  size = "sm",
  position = "right",
  emotion = "idle",
  message,
  className,
}: LeoCompanionProps) {
  return (
    <div className={cn(
      "flex items-end gap-2",
      position === "left" && "flex-row-reverse",
      className
    )}>
      <LeoRig
        size={size}
        emotion={emotion}
        message={message}
        showMessage={!!message}
      />
    </div>
  );
}

export default LeoRig;
