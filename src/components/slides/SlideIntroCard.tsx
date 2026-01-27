import { motion } from "framer-motion";
import { ChevronRight, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { MentorGuide } from "./MentorGuide";
import { cn } from "@/lib/utils";

type StackType = "NEWS" | "HISTORY" | "LESSON";

interface SlideIntroCardProps {
  stackTitle: string;
  stackType: StackType;
  themeImage: string | null;
  totalSlides: number;
}

const introContent: Record<StackType, { icon: React.ReactNode; tagline: string; color: string }> = {
  NEWS: { 
    icon: <TrendingUp className="w-6 h-6" />, 
    tagline: "Recognize recurring market forces",
    color: "from-blue-500 to-cyan-400"
  },
  LESSON: { 
    icon: <BookOpen className="w-6 h-6" />, 
    tagline: "5-minute concept deep dive",
    color: "from-emerald-500 to-teal-400"
  },
  HISTORY: { 
    icon: <Sparkles className="w-6 h-6" />, 
    tagline: "Key moments that shaped the industry",
    color: "from-amber-500 to-orange-400"
  }
};

export function SlideIntroCard({ stackTitle, stackType, themeImage, totalSlides }: SlideIntroCardProps) {
  const intro = introContent[stackType];

  return (
    <div className="flex flex-col"  >
      {/* Hero Image with Mascot Overlay */}
      <div className="relative h-64 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-bg-2 to-bg-1">
        {themeImage ? (
          <>
            <img 
              src={themeImage} 
              alt={stackTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-0 via-bg-0/50 to-transparent" />
          </>
        ) : (
          <div className={cn(
            "w-full h-full bg-gradient-to-br",
            intro.color
          )} />
        )}
        
        {/* Mentor Guide positioned on the hero */}
        <div className="absolute bottom-4 left-4 right-4">
          <MentorGuide 
            context={stackTitle} 
            slideIndex={0}
            totalSlides={totalSlides}
            isIntro={true}
          />
        </div>
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col items-center justify-center text-center p-6 bg-bg-1 rounded-b-2xl -mt-4 pt-8">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
          "bg-gradient-to-br shadow-lg",
          intro.color
        )}>
          <div className="text-white">{intro.icon}</div>
        </div>
        
        <p className="text-accent text-caption font-medium mb-1">{stackType}</p>
        <h3 className="text-h2 text-text-primary mb-2">{stackTitle}</h3>
        <p className="text-text-secondary text-body max-w-xs">{intro.tagline}</p>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center gap-2 text-text-muted text-caption"
        >
          <span>Swipe to start</span>
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}
