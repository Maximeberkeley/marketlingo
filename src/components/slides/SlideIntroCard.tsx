import { motion } from "framer-motion";
import { ChevronRight, BookOpen, TrendingUp, Sparkles, Brain, Cpu, Zap, Leaf, Shield, Rocket, Heart, Bot, Sun, Tractor, Truck, Coins, FlaskConical, Lock } from "lucide-react";
import { MascotBreak } from "@/components/mascot";
import { getMarketConfig } from "@/data/marketConfig";
import { cn } from "@/lib/utils";

type StackType = "NEWS" | "HISTORY" | "LESSON";

interface SlideIntroCardProps {
  stackTitle: string;
  stackType: StackType;
  totalSlides: number;
  marketId?: string;
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

export function SlideIntroCard({ stackTitle, stackType, totalSlides, marketId }: SlideIntroCardProps) {
  const intro = introContent[stackType];
  const marketConfig = getMarketConfig(marketId || "aerospace");
  const MarketIcon = marketIcons[marketId || "aerospace"] || <BookOpen className="w-16 h-16 text-white/20" />;

  return (
    <div className="flex flex-col">
      {/* Hero Gradient with Market-Specific Styling */}
      <div className={cn(
        "relative h-48 w-full overflow-hidden rounded-t-2xl",
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
      </div>
      
      {/* Full-body Mascot Break - Random character greets user */}
      <MascotBreak
        type="intro"
        marketId={marketId}
        message={`Welcome! Let's learn about ${stackTitle}.`}
        className="-mt-12 mx-4 relative z-10"
      />
      
      {/* Content Section */}
      <div className="flex flex-col items-center justify-center text-center p-6 bg-bg-1 rounded-b-2xl mt-4">
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
