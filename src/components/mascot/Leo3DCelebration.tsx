import { motion, AnimatePresence } from "framer-motion";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useEffect } from "react";
import { LeoCharacter } from "./LeoStateMachine";

interface Leo3DCelebrationProps {
  isVisible: boolean;
  type: "lesson" | "game" | "drill" | "achievement" | "streak";
  message?: string;
  onComplete?: () => void;
}

// 2D Confetti particles with Framer Motion
function Confetti2D() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.5 + Math.random() * 2,
    color: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#FFA500'][Math.floor(Math.random() * 6)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ 
            left: `${p.x}%`, 
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            top: -20,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ 
            y: '100vh', 
            rotate: p.rotation + 360 * 3, 
            opacity: [1, 1, 0.5, 0],
            x: [0, (Math.random() - 0.5) * 100],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Sparkle effect around Leo
function Sparkles() {
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    delay: i * 0.1,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute w-2 h-2 rounded-full bg-yellow-400"
          style={{
            transformOrigin: 'center',
          }}
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 0,
          }}
          animate={{ 
            scale: [0, 1.5, 0],
            x: [0, Math.cos(s.angle * Math.PI / 180) * 80],
            y: [0, Math.sin(s.angle * Math.PI / 180) * 80],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.2,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

const celebrationMessages = {
  lesson: ["Lesson mastered! 🎓", "Knowledge unlocked!", "You crushed it!"],
  game: ["Game champion! 🏆", "High score!", "Brain power!"],
  drill: ["Speed demon! ⚡", "Lightning fast!", "Quick thinking!"],
  achievement: ["Achievement unlocked! 🌟", "New milestone!", "You're growing!"],
  streak: ["Streak on fire! 🔥", "Keep it going!", "Unstoppable!"],
};

export function Leo3DCelebration({ 
  isVisible, 
  type, 
  message, 
  onComplete 
}: Leo3DCelebrationProps) {
  const { play } = useSoundEffects();
  
  const randomMessage = message || 
    celebrationMessages[type][Math.floor(Math.random() * celebrationMessages[type].length)];

  useEffect(() => {
    if (isVisible) {
      play("celebration");
    }
  }, [isVisible, play]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onComplete}
        >
          {/* Background with gradient */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-bg-0/95 via-bg-1/90 to-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          
          {/* Confetti */}
          <Confetti2D />
          
          {/* Sparkles around Leo */}
          <div className="relative">
            <Sparkles />
            
            {/* Leo Character - Celebrating */}
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="relative z-10 flex flex-col items-center"
            >
              <LeoCharacter 
                size="xl"
                animation="celebrating"
              />
            </motion.div>
          </div>
          
          {/* UI Overlay */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15, delay: 0.3 }}
            className="absolute bottom-32 left-0 right-0 text-center px-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-text-primary mb-3 drop-shadow-lg"
            >
              {randomMessage}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
              className="text-text-muted text-sm"
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Alias for backwards compatibility
export const LeoCelebration = Leo3DCelebration;
