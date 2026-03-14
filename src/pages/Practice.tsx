import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Target, Gamepad2, Zap, FileText, Shield, Globe, 
  TrendingUp, BookOpen, Crown, ChevronRight, Sparkles 
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { hapticFeedback } from "@/lib/ios-utils";
import { cn } from "@/lib/utils";

// Editorial hero images
import trainerHero from "@/assets/cards/trainer-practice-hero.jpg";
import gamesHero from "@/assets/cards/games-hero.jpg";
import drillsHero from "@/assets/cards/drills-hero.jpg";
import interviewLabHero from "@/assets/cards/interview-lab-hero.jpg";
import summariesHero from "@/assets/cards/summaries-hero.jpg";
import regulatoryHero from "@/assets/cards/regulatory-hero.jpg";
import passportHero from "@/assets/cards/passport-hero.jpg";
import investmentHero from "@/assets/cards/investment-hero.jpg";
import notebookHero from "@/assets/cards/notebook-hero.jpg";

interface ResourceCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  gradient: string;
  path: string;
  icon: typeof Target;
  iconColor: string;
  isPro?: boolean;
}

const practiceCards: ResourceCard[] = [
  {
    id: "trainer",
    title: "Trainer",
    subtitle: "Scenario Analysis",
    description: "Real-world case studies with expert feedback and mental models.",
    image: trainerHero,
    gradient: "from-violet-900/90 via-violet-800/60 to-transparent",
    path: "/trainer",
    icon: Target,
    iconColor: "text-violet-300",
  },
  {
    id: "games",
    title: "Games",
    subtitle: "Test Your Knowledge",
    description: "Quick MCQ challenges based on real industry patterns.",
    image: gamesHero,
    gradient: "from-indigo-900/90 via-indigo-800/60 to-transparent",
    path: "/games",
    icon: Gamepad2,
    iconColor: "text-indigo-300",
  },
  {
    id: "drills",
    title: "Drills",
    subtitle: "15-Second Challenges",
    description: "Rapid-fire True/False to build pattern recognition.",
    image: drillsHero,
    gradient: "from-amber-900/90 via-amber-800/60 to-transparent",
    path: "/drills",
    icon: Zap,
    iconColor: "text-amber-300",
  },
];

const resourceCards: ResourceCard[] = [
  {
    id: "summaries",
    title: "Summaries",
    subtitle: "Market Digests",
    description: "Daily and weekly recaps of everything you've learned.",
    image: summariesHero,
    gradient: "from-orange-900/90 via-orange-800/60 to-transparent",
    path: "/summaries",
    icon: FileText,
    iconColor: "text-orange-300",
  },
  {
    id: "regulatory",
    title: "Regulatory Hub",
    subtitle: "Compliance & Policy",
    description: "Stay informed on key regulations shaping your industry.",
    image: regulatoryHero,
    gradient: "from-blue-900/90 via-blue-800/60 to-transparent",
    path: "/regulatory-hub",
    icon: Shield,
    iconColor: "text-blue-300",
  },
  {
    id: "notebook",
    title: "Notebook",
    subtitle: "Your Insights",
    description: "All your captured notes and key takeaways in one place.",
    image: notebookHero,
    gradient: "from-rose-900/90 via-rose-800/60 to-transparent",
    path: "/notebook",
    icon: BookOpen,
    iconColor: "text-rose-300",
  },
  {
    id: "passport",
    title: "Passport",
    subtitle: "Industry Credentials",
    description: "Track your verified expertise across industries.",
    image: passportHero,
    gradient: "from-teal-900/90 via-teal-800/60 to-transparent",
    path: "/passport",
    icon: Globe,
    iconColor: "text-teal-300",
  },
  {
    id: "investment",
    title: "Investment Lab",
    subtitle: "Investment Scenarios",
    description: "Real-world investment analysis and portfolio building.",
    image: investmentHero,
    gradient: "from-emerald-900/90 via-emerald-800/60 to-transparent",
    path: "/investment-lab",
    icon: TrendingUp,
    iconColor: "text-emerald-300",
    isPro: true,
  },
];

function SwipeableCarousel({ cards, title }: { cards: ResourceCard[]; title: string }) {
  const navigate = useNavigate();
  const { isProUser } = useSubscription();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isScrolling.current) return;
    const el = scrollRef.current;
    const cardWidth = el.offsetWidth * 0.82;
    const gap = 12;
    const idx = Math.round(el.scrollLeft / (cardWidth + gap));
    setCurrentIndex(Math.min(idx, cards.length - 1));
  }, [cards.length]);

  const scrollToIndex = useCallback((idx: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.offsetWidth * 0.82;
    const gap = 12;
    isScrolling.current = true;
    scrollRef.current.scrollTo({ left: idx * (cardWidth + gap), behavior: "smooth" });
    setCurrentIndex(idx);
    setTimeout(() => { isScrolling.current = false; }, 400);
  }, []);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-[15px] font-bold text-text-primary">{title}</p>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === currentIndex
                  ? "w-5 h-2 bg-primary"
                  : "w-2 h-2 bg-text-muted/30"
              )}
            />
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4"
        style={{ scrollPaddingLeft: "16px" }}
      >
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const locked = card.isPro && !isProUser;

          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * idx, type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                hapticFeedback("light");
                if (locked) navigate("/subscription");
                else navigate(card.path);
              }}
              className="relative flex-shrink-0 snap-start rounded-[20px] overflow-hidden text-left"
              style={{ width: "82%", minWidth: "82%", aspectRatio: "4/3" }}
            >
              {/* Background Image */}
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient}`} />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Icon size={16} className={card.iconColor} />
                  </div>
                  <span className="text-[11px] font-medium text-white/70 uppercase tracking-wider">
                    {card.subtitle}
                  </span>
                  {locked && (
                    <span className="flex items-center gap-0.5 ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/80 text-white">
                      <Crown size={8} /> PRO
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                <p className="text-[13px] text-white/75 leading-relaxed">{card.description}</p>
              </div>

              {/* Locked overlay */}
              {locked && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <AppLayout>
      <div className="pt-safe pb-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 pb-2"
        >
          <h1 className="text-[26px] font-bold text-text-primary">Practice</h1>
          <p className="text-[13px] text-text-muted">Sharpen your skills and explore resources</p>
        </motion.div>

        {/* Practice Activities - Swipeable */}
        <SwipeableCarousel cards={practiceCards} title="Activities" />

        {/* Resources - Swipeable */}
        <SwipeableCarousel cards={resourceCards} title="Resources" />
      </div>
    </AppLayout>
  );
}
