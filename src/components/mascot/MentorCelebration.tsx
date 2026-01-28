import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, Heart, Flame } from "lucide-react";
import { mentors } from "@/data/mentors";
import { getPrimaryMentorForMarket } from "@/data/marketConfig";

interface MentorCelebrationProps {
  isVisible: boolean;
  marketId: string;
  type: "lesson" | "game" | "drill" | "streak";
  message?: string;
  onComplete?: () => void;
}

export function MentorCelebration({ isVisible, marketId, type, message, onComplete }: MentorCelebrationProps) {
  // Get the primary mentor for this market
  const mentorId = getPrimaryMentorForMarket(marketId);
  const mentor = mentors.find(m => m.id === mentorId) || mentors[0];
  
  // Get a celebration expression from the mentor if available
  const celebrationExpressions = mentor.expressions?.celebrating || [
    "Amazing work! 🎉",
    "You're crushing it!",
    "Look at you go!",
    "Incredible progress!",
  ];
  
  const randomExpression = message || celebrationExpressions[Math.floor(Math.random() * celebrationExpressions.length)];

  const typeIcons = {
    lesson: <Trophy size={20} className="text-yellow-400" />,
    game: <Star size={20} className="text-purple-400" />,
    drill: <Sparkles size={20} className="text-cyan-400" />,
    streak: <Flame size={20} className="text-orange-400" />,
  };

  const typeLabels = {
    lesson: "Lesson Complete",
    game: "Game Won",
    drill: "Drill Finished",
    streak: "Streak Extended",
  };

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
          {/* Floating hearts/stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: "50vw",
                  y: "100vh",
                  opacity: 0,
                }}
                animate={{
                  x: `${30 + Math.random() * 40}vw`,
                  y: "-20vh",
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              >
                {i % 2 === 0 ? (
                  <Heart size={20} className="text-pink-400 fill-pink-400" />
                ) : (
                  <Star size={20} className="text-yellow-400 fill-yellow-400" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Main celebration card */}
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="relative"
          >
            <div className="relative bg-bg-2 border border-border rounded-3xl p-6 text-center max-w-xs mx-4">
              {/* Mentor avatar with jump animation */}
              <motion.div
                animate={{
                  y: [0, -15, 0, -10, 0, -5, 0],
                }}
                transition={{
                  duration: 1.2,
                  times: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
                  ease: "easeOut",
                }}
                className="relative -mt-16 mb-3"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -5, 5, 0],
                  }}
                  transition={{ 
                    duration: 0.8,
                    delay: 0.2,
                    ease: "easeInOut" 
                  }}
                  className="relative inline-block"
                >
                  {/* Glow behind avatar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/40 to-primary/40 rounded-full blur-xl" />
                  
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-28 h-28 rounded-full border-4 border-bg-2 object-cover object-[50%_30%] relative z-10 shadow-2xl"
                  />
                  
                  {/* Celebration badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -bottom-1 -right-1 w-10 h-10 bg-accent rounded-full flex items-center justify-center z-20 shadow-lg"
                  >
                    {typeIcons[type]}
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Mentor name */}
              <p className="text-caption text-accent font-medium mb-1">{mentor.name}</p>

              {/* Message */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-text-primary mb-3"
              >
                "{randomExpression}"
              </motion.h2>

              {/* Type indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-1"
              >
                {typeIcons[type]}
                <span className="text-caption text-text-secondary">{typeLabels[type]}</span>
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
