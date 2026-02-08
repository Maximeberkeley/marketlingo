import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { mentors } from "@/data/mentors";
import { getPrimaryMentorForMarket } from "@/data/marketConfig";
import leoSticker from "@/assets/leo-sticker.png";

// ============================================
// SLIDE MASCOT CARD - Premium "mental break" UI
// A visually engaging mascot card for lesson slides
// ============================================

type SlidePosition = "first" | "middle" | "last";

interface SlideMascotCardProps {
  position: SlidePosition;
  slideIndex: number;
  totalSlides: number;
  marketId?: string;
  className?: string;
}

// Character data
interface Character {
  id: string;
  name: string;
  avatar: string;
  isLeo: boolean;
}

const getLeo = (): Character => ({
  id: "leo",
  name: "Leo",
  avatar: leoSticker,
  isLeo: true,
});

const getMentorCharacter = (marketId?: string): Character => {
  const mentorId = marketId ? getPrimaryMentorForMarket(marketId) : "sophia";
  const mentor = mentors.find(m => m.id === mentorId) || mentors[0];
  return {
    id: mentor.id,
    name: mentor.name.split(" ")[0],
    avatar: mentor.avatar,
    isLeo: false,
  };
};

// Messages based on position
const getMessages = (position: SlidePosition, charName: string, slideIndex: number, totalSlides: number) => {
  const progress = Math.round(((slideIndex + 1) / totalSlides) * 100);
  
  const messageBank: Record<SlidePosition, { greeting: string; subtext: string }[]> = {
    first: [
      { greeting: "Let's learn together! 🚀", subtext: "I'll be here to guide you" },
      { greeting: "Ready to dive in?", subtext: "This is going to be great!" },
      { greeting: "Hey there! 👋", subtext: "Let's make this fun" },
    ],
    middle: [
      { greeting: `${progress}% complete! 💪`, subtext: "You're doing amazing" },
      { greeting: "Great progress!", subtext: "Keep that momentum going" },
      { greeting: "Halfway there! 🔥", subtext: "Almost to the finish line" },
    ],
    last: [
      { greeting: "You crushed it! 🎉", subtext: "Another lesson conquered" },
      { greeting: "Brilliant work!", subtext: "Knowledge is power" },
      { greeting: "All done! 🏆", subtext: "See you next time" },
    ],
  };
  
  const options = messageBank[position];
  return options[slideIndex % options.length];
};

// Gradient based on position
const getGradient = (position: SlidePosition): string => {
  switch (position) {
    case "first":
      return "from-primary/15 via-primary/5 to-transparent";
    case "middle":
      return "from-amber-500/15 via-amber-500/5 to-transparent";
    case "last":
      return "from-emerald-500/15 via-emerald-500/5 to-transparent";
  }
};

const getAccentColor = (position: SlidePosition): string => {
  switch (position) {
    case "first":
      return "text-primary";
    case "middle":
      return "text-amber-400";
    case "last":
      return "text-emerald-400";
  }
};

export function SlideMascotCard({
  position,
  slideIndex,
  totalSlides,
  marketId,
  className,
}: SlideMascotCardProps) {
  // Alternate between Leo and market mentor
  const character = useMemo(() => {
    // First slide: primary mentor, Middle: Leo, Last: primary mentor
    if (position === "first" || position === "last") {
      return getMentorCharacter(marketId);
    }
    return getLeo();
  }, [position, marketId]);
  
  const messages = useMemo(
    () => getMessages(position, character.name, slideIndex, totalSlides),
    [position, character.name, slideIndex, totalSlides]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        "bg-gradient-to-br border border-border/50",
        "flex items-center gap-4",
        getGradient(position),
        className
      )}
    >
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-white/10 blur-2xl"
          animate={{
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "-20%", right: "-10%" }}
        />
      </div>
      
      {/* Character Avatar */}
      <motion.div
        className="relative flex-shrink-0"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className={cn(
          "relative overflow-hidden",
          character.isLeo ? "w-16 h-16" : "w-14 h-14 rounded-full"
        )}>
          <img
            src={character.avatar}
            alt={character.name}
            className={cn(
              "w-full h-full object-cover",
              !character.isLeo && "rounded-full border-2 border-white/30"
            )}
          />
        </div>
        
        {/* Glow effect */}
        <div 
          className={cn(
            "absolute inset-0 -z-10 blur-lg opacity-50",
            position === "last" ? "bg-emerald-500" : 
            position === "middle" ? "bg-amber-500" : "bg-primary"
          )}
        />
      </motion.div>
      
      {/* Text Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("font-semibold text-lg", getAccentColor(position))}
        >
          {messages.greeting}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-caption text-text-secondary mt-0.5"
        >
          — {character.name}
        </motion.p>
      </div>
      
      {/* Sparkle decorations for last slide */}
      {position === "last" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-yellow-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.5 + i * 0.2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${60 + Math.random() * 30}%`,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Determine which position type based on slide
// ============================================
export function getSlidePosition(
  slideIndex: number, 
  totalSlides: number
): SlidePosition | null {
  if (slideIndex === 0) return "first";
  
  const midpoint = Math.floor(totalSlides / 2);
  if (slideIndex === midpoint && totalSlides > 3) return "middle";
  
  if (slideIndex === totalSlides - 1) return "last";
  
  return null;
}

export default SlideMascotCard;
