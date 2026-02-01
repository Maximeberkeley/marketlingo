import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimationState = "idle" | "waving" | "jumping" | "celebrating" | "thinking";

interface Leo2DProps {
  size?: "sm" | "md" | "lg" | "xl";
  animation?: AnimationState;
  message?: string;
  showMessage?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 180,
};

// Classic 2D Disney-style animated fox with graduation hat
export function Leo2D({
  size = "md",
  animation = "idle",
  message,
  showMessage = false,
  className,
  onClick,
}: Leo2DProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const pixelSize = sizeMap[size];
  
  // Natural blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 2500 + Math.random() * 2000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Animation variants for different states
  const bodyVariants = {
    idle: {
      y: [0, -3, 0],
      rotate: [0, 0.5, 0, -0.5, 0],
      transition: {
        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      },
    },
    waving: {
      y: [0, -5, 0],
      rotate: [0, 2, -2, 0],
      transition: {
        y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
      },
    },
    jumping: {
      y: [0, -20, 0],
      scale: [1, 1.1, 0.95, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 0.4,
        ease: "easeOut",
      },
    },
    celebrating: {
      y: [0, -15, 0],
      rotate: [-3, 3, -3],
      scale: [1, 1.08, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    thinking: {
      y: [0, -2, 0],
      rotate: [0, 5, 5, 0],
      transition: {
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" as const },
      },
    },
  };

  const earVariants = {
    idle: {
      rotate: [0, 5, 0, -5, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
    waving: {
      rotate: [0, 8, -8, 0],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
    },
    jumping: {
      rotate: [-10, 10],
      transition: { duration: 0.3, repeat: Infinity, ease: "easeInOut" },
    },
    celebrating: {
      rotate: [-12, 12],
      transition: { duration: 0.25, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
      rotate: [0, 3, 0],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const tailVariants = {
    idle: {
      rotate: [0, 15, 0, -15, 0],
      transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
    },
    waving: {
      rotate: [-20, 20],
      transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
    },
    jumping: {
      rotate: [-25, 25],
      transition: { duration: 0.3, repeat: Infinity, ease: "easeInOut" },
    },
    celebrating: {
      rotate: [-30, 30],
      transition: { duration: 0.2, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
      rotate: [5, 10, 5],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <div className={cn("relative flex items-end gap-3", className)}>
      <motion.div
        className="relative cursor-pointer"
        onClick={onClick}
        style={{ width: pixelSize, height: pixelSize }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* White sticker outline effect */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "white",
            transform: "scale(1.06)",
            filter: "blur(1px)",
            zIndex: 0,
          }}
        />
        
        {/* Soft drop shadow */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4/5 h-6 rounded-full bg-black/20 blur-lg"
          style={{ 
            transform: "translateX(-50%) translateY(50%) scaleY(0.3)",
            zIndex: 0,
          }}
        />

        {/* SVG Fox Character - Classic 2D Disney Style */}
        <motion.svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full"
          animate={bodyVariants[animation]}
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}
        >
          <defs>
            {/* Gradients for cell-shading effect */}
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8C42" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="bellyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>
            <linearGradient id="hatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D4A6F" />
              <stop offset="100%" stopColor="#1E3A5F" />
            </linearGradient>
            <linearGradient id="tasselGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
            <radialGradient id="cheekBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Tail */}
          <motion.g 
            animate={tailVariants[animation]} 
            style={{ originX: "160px", originY: "140px" }}
          >
            <ellipse cx="165" cy="140" rx="18" ry="35" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2.5" transform="rotate(35, 165, 140)" />
            <ellipse cx="175" cy="115" rx="10" ry="15" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" transform="rotate(35, 175, 115)" />
          </motion.g>

          {/* Body */}
          <ellipse cx="100" cy="145" rx="45" ry="40" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="3" />
          
          {/* Belly */}
          <ellipse cx="100" cy="155" rx="28" ry="25" fill="url(#bellyGradient)" stroke="#FDBA74" strokeWidth="2" />

          {/* Left Paw */}
          <ellipse cx="70" cy="178" rx="14" ry="10" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2" />
          
          {/* Right Paw */}
          <ellipse cx="130" cy="178" rx="14" ry="10" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2" />

          {/* Head */}
          <circle cx="100" cy="85" r="48" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="3" />

          {/* Left cheek fluff */}
          <ellipse cx="55" cy="95" rx="15" ry="12" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2" />
          
          {/* Right cheek fluff */}
          <ellipse cx="145" cy="95" rx="15" ry="12" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2" />

          {/* Snout/muzzle */}
          <ellipse cx="100" cy="105" rx="22" ry="18" fill="url(#bellyGradient)" stroke="#FDBA74" strokeWidth="2" />

          {/* Left Ear */}
          <motion.g animate={earVariants[animation]} style={{ originX: "68px", originY: "55px" }}>
            <polygon points="55,55 68,10 81,55" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="60,52 68,22 76,52" fill="#FECACA" stroke="#FECACA" strokeWidth="1" strokeLinejoin="round" />
          </motion.g>

          {/* Right Ear */}
          <motion.g animate={earVariants[animation]} style={{ originX: "132px", originY: "55px" }}>
            <polygon points="119,55 132,10 145,55" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="124,52 132,22 140,52" fill="#FECACA" stroke="#FECACA" strokeWidth="1" strokeLinejoin="round" />
          </motion.g>

          {/* Forehead tuft */}
          <path d="M95,45 Q100,30 105,45" fill="url(#bodyGradient)" stroke="#D97706" strokeWidth="2" />

          {/* Left Eye White */}
          <ellipse cx="78" cy="78" rx="14" ry={isBlinking ? 2 : 12} fill="white" stroke="#374151" strokeWidth="1.5" />
          
          {/* Left Pupil */}
          {!isBlinking && (
            <>
              <circle cx="80" cy="80" r="7" fill="#1F2937" />
              <circle cx="83" cy="77" r="2.5" fill="white" />
            </>
          )}

          {/* Right Eye White */}
          <ellipse cx="122" cy="78" rx="14" ry={isBlinking ? 2 : 12} fill="white" stroke="#374151" strokeWidth="1.5" />
          
          {/* Right Pupil */}
          {!isBlinking && (
            <>
              <circle cx="124" cy="80" r="7" fill="#1F2937" />
              <circle cx="127" cy="77" r="2.5" fill="white" />
            </>
          )}

          {/* Eyebrows for expression */}
          {animation === "thinking" && (
            <>
              <path d="M65,65 Q78,60 90,68" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M110,68 Q122,60 135,65" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Left Cheek Blush */}
          <ellipse cx="60" cy="95" rx="10" ry="7" fill="url(#cheekBlush)" />
          
          {/* Right Cheek Blush */}
          <ellipse cx="140" cy="95" rx="10" ry="7" fill="url(#cheekBlush)" />

          {/* Nose */}
          <ellipse cx="100" cy="100" rx="8" ry="6" fill="#1F2937" />
          <ellipse cx="102" cy="98" rx="2" ry="1.5" fill="white" opacity="0.5" />

          {/* Mouth - friendly smile */}
          <path 
            d={animation === "celebrating" || animation === "jumping" 
              ? "M88,112 Q100,125 112,112" 
              : "M90,110 Q100,118 110,110"
            } 
            stroke="#8B4513" 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round" 
          />

          {/* === GRADUATION HAT === */}
          <g>
            {/* Hat base/mortarboard */}
            <polygon 
              points="55,38 100,25 145,38 100,50" 
              fill="url(#hatGradient)" 
              stroke="#1E3A5F" 
              strokeWidth="2"
            />
            
            {/* Hat cap (skull part) */}
            <ellipse cx="100" cy="42" rx="22" ry="12" fill="#0F2744" stroke="#1E3A5F" strokeWidth="1.5" />
            
            {/* Button on top */}
            <circle cx="100" cy="35" r="4" fill="#EAB308" stroke="#D97706" strokeWidth="1" />
            
            {/* Tassel cord */}
            <motion.g
              animate={{
                rotate: animation === "jumping" || animation === "celebrating" ? [-15, 15] : [-5, 5],
              }}
              transition={{
                duration: animation === "jumping" || animation === "celebrating" ? 0.3 : 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "100px", originY: "35px" }}
            >
              <path d="M100,35 Q115,45 125,55" stroke="url(#tasselGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
              
              {/* Tassel end */}
              <ellipse cx="125" cy="58" rx="5" ry="8" fill="url(#tasselGradient)" stroke="#D97706" strokeWidth="1" />
              
              {/* Tassel fringe */}
              <line x1="122" y1="66" x2="121" y2="75" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="125" y1="66" x2="125" y2="76" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="128" y1="66" x2="129" y2="75" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>
          </g>
        </motion.svg>
      </motion.div>

      {/* Speech bubble */}
      {showMessage && message && (
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          className="relative bg-bg-2 rounded-2xl rounded-bl-md px-4 py-3 border border-border shadow-lg max-w-[200px]"
        >
          {/* Bubble pointer */}
          <div className="absolute left-0 bottom-3 w-3 h-3 bg-bg-2 border-l border-b border-border transform -translate-x-1.5 rotate-45" />
          
          <p className="text-sm text-text-primary font-medium leading-snug">
            {message}
          </p>
          <p className="text-xs text-accent mt-1">— Leo</p>
        </motion.div>
      )}
    </div>
  );
}

// Interactive version with tap-to-animate
export function Leo2DInteractive({
  size = "lg",
  initialMessage,
  onTap,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  initialMessage?: string;
  onTap?: () => void;
}) {
  const [animation, setAnimation] = useState<AnimationState>("idle");
  const [message, setMessage] = useState(initialMessage);
  const [tapCount, setTapCount] = useState(0);

  const animations: AnimationState[] = ["jumping", "waving", "celebrating", "thinking"];
  const messages = [
    "Wheee! 🎉",
    "Hey there! 👋",
    "Let's goooo! 🚀",
    "Hmm, interesting... 🤔",
  ];

  const handleTap = () => {
    const nextIndex = tapCount % animations.length;
    setAnimation(animations[nextIndex]);
    setMessage(messages[nextIndex]);
    setTapCount(prev => prev + 1);

    setTimeout(() => {
      setAnimation("idle");
      setMessage(initialMessage);
    }, 2500);

    onTap?.();
  };

  return (
    <Leo2D
      size={size}
      animation={animation}
      message={message}
      showMessage={!!message}
      onClick={handleTap}
    />
  );
}

export default Leo2D;
