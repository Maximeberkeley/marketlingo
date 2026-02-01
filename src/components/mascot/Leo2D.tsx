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
        {/* Soft drop shadow under character */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-3/5 h-4 rounded-full bg-black/25 blur-md"
          style={{ 
            transform: "translateX(-50%) translateY(60%) scaleY(0.25)",
            zIndex: 0,
          }}
        />

        {/* SVG Fox Character - Soft 3D Style like reference image */}
        <motion.svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full"
          animate={bodyVariants[animation]}
          style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))" }}
        >
          <defs>
            {/* Soft 3D gradients for rounded look */}
            <radialGradient id="bodyGradient3D" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FF9B57" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#E56510" />
            </radialGradient>
            <radialGradient id="bellyGradient3D" cx="50%" cy="25%" r="80%">
              <stop offset="0%" stopColor="#FFF5E8" />
              <stop offset="70%" stopColor="#FFDDB8" />
              <stop offset="100%" stopColor="#F5C896" />
            </radialGradient>
            <radialGradient id="hatGradient3D" cx="30%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#3B5F8C" />
              <stop offset="100%" stopColor="#1A365D" />
            </radialGradient>
            <radialGradient id="tasselGradient3D" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFE066" />
              <stop offset="100%" stopColor="#D4A20F" />
            </radialGradient>
            <radialGradient id="cheekBlush3D" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9E9E" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF9E9E" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="eyeWhite3D" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F0F0F0" />
            </radialGradient>
          </defs>

          {/* Tail - soft round */}
          <motion.g 
            animate={tailVariants[animation]} 
            style={{ originX: "158px", originY: "135px" }}
          >
            <ellipse cx="162" cy="135" rx="20" ry="32" fill="url(#bodyGradient3D)" transform="rotate(30, 162, 135)" />
            <ellipse cx="170" cy="112" rx="12" ry="16" fill="url(#bellyGradient3D)" transform="rotate(30, 170, 112)" />
          </motion.g>

          {/* Body - rounder, softer */}
          <ellipse cx="100" cy="148" rx="50" ry="42" fill="url(#bodyGradient3D)" />
          
          {/* Belly - cream colored, prominent */}
          <ellipse cx="100" cy="155" rx="35" ry="30" fill="url(#bellyGradient3D)" />

          {/* Left Arm/Paw */}
          <ellipse cx="55" cy="145" rx="15" ry="12" fill="url(#bodyGradient3D)" />
          
          {/* Right Arm/Paw - slightly waving position */}
          <motion.ellipse 
            cx="145" 
            cy="142" 
            rx="15" 
            ry="12" 
            fill="url(#bodyGradient3D)"
            animate={animation === "waving" ? { 
              cx: [145, 150, 145],
              cy: [142, 135, 142]
            } : {}}
            transition={{ duration: 0.6, repeat: animation === "waving" ? Infinity : 0 }}
          />

          {/* Left Foot */}
          <ellipse cx="72" cy="182" rx="16" ry="10" fill="url(#bodyGradient3D)" />
          
          {/* Right Foot */}
          <ellipse cx="128" cy="182" rx="16" ry="10" fill="url(#bodyGradient3D)" />

          {/* Head - larger, rounder for cute look */}
          <circle cx="100" cy="82" r="52" fill="url(#bodyGradient3D)" />

          {/* Cheek fluffs - softer */}
          <ellipse cx="52" cy="90" rx="14" ry="11" fill="url(#bodyGradient3D)" />
          <ellipse cx="148" cy="90" rx="14" ry="11" fill="url(#bodyGradient3D)" />

          {/* Snout/muzzle - cream, soft */}
          <ellipse cx="100" cy="100" rx="26" ry="20" fill="url(#bellyGradient3D)" />

          {/* Left Ear */}
          <motion.g animate={earVariants[animation]} style={{ originX: "70px", originY: "52px" }}>
            <ellipse cx="70" cy="35" rx="14" ry="28" fill="url(#bodyGradient3D)" transform="rotate(-15, 70, 35)" />
            <ellipse cx="70" cy="38" rx="8" ry="18" fill="#FFB8B8" transform="rotate(-15, 70, 38)" opacity="0.7" />
          </motion.g>

          {/* Right Ear */}
          <motion.g animate={earVariants[animation]} style={{ originX: "130px", originY: "52px" }}>
            <ellipse cx="130" cy="35" rx="14" ry="28" fill="url(#bodyGradient3D)" transform="rotate(15, 130, 35)" />
            <ellipse cx="130" cy="38" rx="8" ry="18" fill="#FFB8B8" transform="rotate(15, 130, 38)" opacity="0.7" />
          </motion.g>

          {/* Left Eye - large, expressive */}
          <ellipse cx="78" cy="78" rx="16" ry={isBlinking ? 2 : 14} fill="url(#eyeWhite3D)" />
          {!isBlinking && (
            <>
              <circle cx="81" cy="80" r="9" fill="#1A1A2E" />
              <circle cx="84" cy="76" r="4" fill="white" />
              <circle cx="78" cy="84" r="2" fill="white" opacity="0.6" />
            </>
          )}

          {/* Right Eye - large, expressive */}
          <ellipse cx="122" cy="78" rx="16" ry={isBlinking ? 2 : 14} fill="url(#eyeWhite3D)" />
          {!isBlinking && (
            <>
              <circle cx="125" cy="80" r="9" fill="#1A1A2E" />
              <circle cx="128" cy="76" r="4" fill="white" />
              <circle cx="122" cy="84" r="2" fill="white" opacity="0.6" />
            </>
          )}

          {/* Eyebrows for thinking expression */}
          {animation === "thinking" && (
            <>
              <ellipse cx="78" cy="62" rx="12" ry="4" fill="#E56510" transform="rotate(-10, 78, 62)" />
              <ellipse cx="122" cy="62" rx="12" ry="4" fill="#E56510" transform="rotate(10, 122, 62)" />
            </>
          )}

          {/* Cheek blushes */}
          <ellipse cx="55" cy="94" rx="12" ry="8" fill="url(#cheekBlush3D)" />
          <ellipse cx="145" cy="94" rx="12" ry="8" fill="url(#cheekBlush3D)" />

          {/* Nose - rounded, shiny */}
          <ellipse cx="100" cy="98" rx="10" ry="7" fill="#1A1A2E" />
          <ellipse cx="97" cy="95" rx="4" ry="3" fill="white" opacity="0.4" />

          {/* Mouth - cute smile */}
          <path 
            d={animation === "celebrating" || animation === "jumping" 
              ? "M88,110 Q100,122 112,110" 
              : "M90,108 Q100,116 110,108"
            } 
            stroke="#8B4513" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
          />

          {/* === GRADUATION HAT === */}
          <g>
            {/* Hat base/mortarboard - softer look */}
            <path 
              d="M50,38 L100,22 L150,38 L100,52 Z" 
              fill="url(#hatGradient3D)" 
            />
            
            {/* Hat cap (skull part) */}
            <ellipse cx="100" cy="40" rx="24" ry="14" fill="#1A365D" />
            
            {/* Button on top */}
            <circle cx="100" cy="32" r="5" fill="url(#tasselGradient3D)" />
            
            {/* Tassel cord */}
            <motion.g
              animate={{
                rotate: animation === "jumping" || animation === "celebrating" ? [-18, 18] : [-6, 6],
              }}
              transition={{
                duration: animation === "jumping" || animation === "celebrating" ? 0.25 : 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "100px", originY: "32px" }}
            >
              <path d="M100,32 Q118,45 128,58" stroke="url(#tasselGradient3D)" strokeWidth="4" fill="none" strokeLinecap="round" />
              
              {/* Tassel end */}
              <ellipse cx="128" cy="62" rx="6" ry="10" fill="url(#tasselGradient3D)" />
              
              {/* Tassel fringe */}
              <line x1="124" y1="72" x2="122" y2="82" stroke="#D4A20F" strokeWidth="2" strokeLinecap="round" />
              <line x1="128" y1="72" x2="128" y2="84" stroke="#D4A20F" strokeWidth="2" strokeLinecap="round" />
              <line x1="132" y1="72" x2="134" y2="82" stroke="#D4A20F" strokeWidth="2" strokeLinecap="round" />
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
