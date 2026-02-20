import { motion } from "framer-motion";
import { ChevronRight, BookOpen, TrendingUp, Sparkles, Brain, Cpu, Zap, Leaf, Shield, Rocket, Heart, Bot, Sun, Tractor, Truck, Coins, FlaskConical, Lock, MapPin, CheckCircle2 } from "lucide-react";
import { MascotBreak } from "@/components/mascot";
import { getMarketConfig } from "@/data/marketConfig";
import { cn } from "@/lib/utils";

type StackType = "NEWS" | "HISTORY" | "LESSON";

interface SlideIntroCardProps {
  stackTitle: string;
  stackType: StackType;
  totalSlides: number;
  marketId?: string;
  dayNumber?: number;
  marketName?: string;
  slideTitles?: string[]; // For the syllabus preview
}

const introContent: Record<StackType, { icon: React.ReactNode; tagline: string; color: string; description: string }> = {
  NEWS: { 
    icon: <TrendingUp className="w-6 h-6" />, 
    tagline: "Recognize recurring market forces",
    description: "Understand what's shaping the industry right now and why it matters for your strategy.",
    color: "from-blue-500 to-cyan-400"
  },
  LESSON: { 
    icon: <BookOpen className="w-6 h-6" />, 
    tagline: "5-minute concept deep dive",
    description: "Master a core concept with real examples, expert framing, and startup-specific takeaways.",
    color: "from-emerald-500 to-teal-400"
  },
  HISTORY: { 
    icon: <Sparkles className="w-6 h-6" />, 
    tagline: "Key moments that shaped the industry",
    description: "Context from the past that explains how the market got here — and where it's going.",
    color: "from-amber-500 to-orange-400"
  }
};

// Market-specific icons for visual variety
const marketIcons: Record<string, React.ReactNode> = {
  aerospace: <Rocket className="w-16 h-16 text-white/20" />,
  neuroscience: <Brain className="w-16 h-16 text-white/20" />,
  ai: <Cpu className="w-16 h-16 text-white/20" />,
  fintech: <Coins className="w-16 h-16 text-white/20" />,
  ev: <Zap className="w-16 h-16 text-white/20" />,
  biotech: <FlaskConical className="w-16 h-16 text-white/20" />,
  cybersecurity: <Shield className="w-16 h-16 text-white/20" />,
  spacetech: <Rocket className="w-16 h-16 text-white/20" />,
  healthtech: <Heart className="w-16 h-16 text-white/20" />,
  robotics: <Bot className="w-16 h-16 text-white/20" />,
  cleanenergy: <Sun className="w-16 h-16 text-white/20" />,
  climatetech: <Leaf className="w-16 h-16 text-white/20" />,
  agtech: <Tractor className="w-16 h-16 text-white/20" />,
  logistics: <Truck className="w-16 h-16 text-white/20" />,
  web3: <Lock className="w-16 h-16 text-white/20" />,
};

function getMonth(day: number) {
  return Math.ceil(day / 30);
}

function getWeek(day: number) {
  return Math.ceil(day / 7);
}

export function SlideIntroCard({ stackTitle, stackType, totalSlides, marketId, dayNumber, marketName, slideTitles }: SlideIntroCardProps) {
  const intro = introContent[stackType];
  const marketConfig = getMarketConfig(marketId || "aerospace");
  const MarketIcon = marketIcons[marketId || "aerospace"] || <BookOpen className="w-16 h-16 text-white/20" />;
  
  const isDay1 = dayNumber === 1;
  const month = dayNumber ? getMonth(dayNumber) : null;
  const week = dayNumber ? getWeek(dayNumber) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Gradient with Market-Specific Styling */}
      <div className={cn(
        "relative h-48 w-full overflow-hidden rounded-2xl",
        "bg-gradient-to-br",
        marketConfig.heroGradient
      )}>
        {/* Abstract Pattern Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 right-4">{MarketIcon}</div>
          <div className="absolute bottom-8 left-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-12 left-1/2 w-16 h-16 rounded-full bg-white/5 blur-xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg-0 via-bg-0/30 to-transparent" />

        {/* Day/Month badge — top left */}
        {dayNumber && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20">
            <MapPin size={11} className="text-white/80" />
            <span className="text-[11px] font-semibold text-white/90">
              Day {dayNumber} · Month {month} · Week {week}
            </span>
          </div>
        )}
      </div>
      
      {/* Full-body Mascot Break */}
      <MascotBreak
        type="intro"
        marketId={marketId}
        message={isDay1 
          ? `Welcome to your ${marketName || "industry"} journey! This is your first of 180 lessons.`
          : `Let's dive into "${stackTitle}".`
        }
        className="relative z-10 -mt-4"
      />
      
      {/* Day 1 Welcome Banner */}
      {isDay1 && stackType === "LESSON" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated border-l-4 border-accent"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Rocket size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-body font-semibold text-text-primary mb-1">Your 180-day journey starts now</p>
              <p className="text-caption text-text-secondary leading-relaxed">
                Over 6 months, you'll go from zero to investor-ready — learning the industry's structure, strategy, and key players through 5-minute daily lessons, hands-on drills, and decision simulations.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content card: type + title + description */}
      <div className="card-elevated flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br shadow-sm",
            intro.color
          )}>
            <div className="text-white">{intro.icon}</div>
          </div>
          <div>
            <p className="text-accent text-[10px] font-bold uppercase tracking-widest">{stackType} · {totalSlides} slides</p>
            <h3 className="text-h3 text-text-primary leading-tight">{stackTitle}</h3>
          </div>
        </div>
        <p className="text-body text-text-secondary leading-relaxed">{intro.description}</p>
      </div>

      {/* Syllabus — What you'll cover */}
      {slideTitles && slideTitles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">What you'll cover</p>
          <div className="space-y-2">
            {slideTitles.map((title, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-text-muted">{idx + 1}</span>
                </div>
                <p className="text-caption text-text-secondary flex-1">{title}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Swipe CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 text-text-muted text-caption py-2"
      >
        <span>Swipe or tap to start</span>
        <ChevronRight className="w-4 h-4 animate-pulse" />
      </motion.div>
    </div>
  );
}
