import { useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, Flame } from "lucide-react";
import leoMascot from "@/assets/mascot/leo-mascot.png";
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
}

export function LeoCelebration({ isVisible, type, message, onComplete, use3D = false }: LeoCelebrationProps) {
  const { play } = useSoundEffects();
  const messages = {
    lesson: ["You're on fire! 🔥", "Lesson complete!", "Knowledge unlocked!", "You crushed it!"],
    game: ["Game champion! 🏆", "Brain power!", "You nailed it!", "Winning streak!"],
    drill: ["Speed demon! ⚡", "Quick thinking!", "Sharp mind!", "Lightning fast!"],
    achievement: ["Achievement unlocked! 🌟", "New badge earned!", "You're growing!", "Milestone reached!"],
  };
  const randomMessage = message || messages[type][Math.floor(Math.random() * messages[type].length)];

  // Play celebration sound when visible
  useEffect(() => {
    if (isVisible) {
      play("celebration");
    }
  }, [isVisible, play]);

  // Use 3D celebration if requested
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onComplete}
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${
                  ["bg-yellow-400", "bg-pink-400", "bg-purple-400", "bg-cyan-400", "bg-green-400"][i % 5]
                }`}
                initial={{
                  x: "50vw",
                  y: "50vh",
                  scale: 0,
                }}
                animate={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: [0, 1.5, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Main celebration card */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-orange-400/30 to-amber-400/30 rounded-3xl blur-2xl" />
            
            <div className="relative bg-bg-2 border-2 border-yellow-400/50 rounded-3xl p-8 text-center max-w-xs">
              {/* Stars */}
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

              {/* Leo jumping animation */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: 3,
                  ease: "easeOut",
                }}
                className="relative mb-4"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: 2,
                    ease: "easeInOut" 
                  }}
                >
                  <img
                    src={leoMascot}
                    alt="Leo celebrating"
                    className="w-32 h-32 mx-auto object-contain drop-shadow-2xl"
                  />
                </motion.div>

                {/* Flame effect around Leo */}
                <motion.div
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity 
                  }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                >
                  <Flame size={40} className="text-orange-400" />
                </motion.div>
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
                {type === "lesson" && <Trophy size={18} className="text-yellow-400" />}
                {type === "game" && <Star size={18} className="text-purple-400" />}
                {type === "drill" && <Sparkles size={18} className="text-cyan-400" />}
                {type === "achievement" && <Flame size={18} className="text-orange-400" />}
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
