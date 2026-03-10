import { useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, Flame, Zap } from "lucide-react";
import leoCelebrating from "@/assets/mascot/leo-celebrating.png";
import { useSoundEffects } from "@/hooks/useSoundEffects";

// Lazy load 3D celebration for performance
const Leo3DCelebration = lazy(() => 
  import("./Leo3DCelebration").then(mod => ({ default: mod.Leo3DCelebration }))
);

interface LeoCelebrationProps {
  isVisible: boolean;
  type: "lesson" | "game" | "drill" | "achievement";
  message?: string;
  onComplete?: () => void;
  use3D?: boolean;
  isPerfect?: boolean;
}

export function LeoCelebration({ isVisible, type, message, onComplete, use3D = false, isPerfect = false }: LeoCelebrationProps) {
  const { play } = useSoundEffects();
  const messages = {
    lesson: ["You're on fire! 🔥", "Lesson complete!", "Knowledge unlocked!", "You crushed it!"],
    game: ["Game champion! 🏆", "Brain power!", "You nailed it!", "Winning streak!"],
    drill: ["Speed demon! ⚡", "Quick thinking!", "Sharp mind!", "Lightning fast!"],
    achievement: ["Achievement unlocked! 🌟", "New badge earned!", "You're growing!", "Milestone reached!"],
  };
  const perfectMessages = [
    "PERFECT SCORE! 💯",
    "Flawless victory! ✨",
    "100% — Unstoppable! 🔥",
    "Not a single miss! 🎯",
  ];
  const randomMessage = message || (isPerfect 
    ? perfectMessages[Math.floor(Math.random() * perfectMessages.length)]
    : messages[type][Math.floor(Math.random() * messages[type].length)]
  );

  useEffect(() => {
    if (isVisible) {
      play("celebration");
    }
  }, [isVisible, play]);

  if (use3D) {
    return (
      <Suspense fallback={null}>
        <Leo3DCelebration 
          isVisible={isVisible} 
          type={type} 
          message={message} 
          onComplete={onComplete} 
        />
      </Suspense>
    );
  }

  const typeConfig = {
    lesson: { icon: Trophy, color: "text-yellow-400", bg: "from-yellow-400/20 via-amber-400/20 to-orange-400/20" },
    game: { icon: Star, color: "text-purple-400", bg: "from-purple-400/20 via-pink-400/20 to-fuchsia-400/20" },
    drill: { icon: Sparkles, color: "text-cyan-400", bg: "from-cyan-400/20 via-blue-400/20 to-indigo-400/20" },
    achievement: { icon: Flame, color: "text-orange-400", bg: "from-orange-400/20 via-red-400/20 to-amber-400/20" },
  };
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onComplete}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(isPerfect ? 30 : 20)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${
                  ["bg-yellow-400", "bg-pink-400", "bg-purple-400", "bg-cyan-400", "bg-green-400"][i % 5]
                }`}
                initial={{ x: "50vw", y: "50vh", scale: 0 }}
                animate={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: [0, 1.5, 1],
                  rotate: [0, 360],
                }}
                transition={{ duration: 1.5, delay: i * 0.04, ease: "easeOut" }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative"
          >
            {/* Glow */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.bg} rounded-3xl blur-2xl`} />
            
            <div className={`relative bg-bg-2 border-2 ${isPerfect ? 'border-yellow-400/60' : 'border-border'} rounded-3xl p-8 text-center max-w-xs`}>
              {/* Perfect badge */}
              {isPerfect && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                  className="absolute -top-3 -right-3 z-20 bg-yellow-400 text-black text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg"
                >
                  💯 PERFECT
                </motion.div>
              )}

              {/* Rotating stars */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4"
              >
                <Star size={32} className="text-yellow-400 fill-yellow-400" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -left-2"
              >
                <Sparkles size={24} className="text-pink-400" />
              </motion.div>

              {/* Leo celebrating - jumping animation */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 0.6, repeat: isPerfect ? 5 : 3, ease: "easeOut" }}
                className="relative mb-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.8, repeat: 2, ease: "easeInOut" }}
                >
                  <img
                    src={leoCelebrating}
                    alt="Leo celebrating"
                    className="w-36 h-36 mx-auto object-contain drop-shadow-2xl"
                  />
                </motion.div>

                {/* Sparkle ring around Leo */}
                {isPerfect && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-yellow-400/40"
                  />
                )}
              </motion.div>

              {/* Message */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-text-primary mb-2"
              >
                {randomMessage}
              </motion.h2>

              {/* Type indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-text-muted"
              >
                <Icon size={18} className={config.color} />
                <span className="text-caption capitalize">{type} Complete</span>
              </motion.div>

              {/* Tap to continue */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
                className="text-caption text-text-muted mt-4"
              >
                Tap to continue
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
