import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ExternalLink, Clock, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  categoryTag: string;
  summary?: string;
  imageUrl?: string;
}

// Placeholder news data - will be replaced with real data from news_items table
const placeholderNews: Record<string, NewsItem[]> = {
  aerospace: [
    {
      id: "1",
      title: "SpaceX Starship completes successful orbital test flight",
      sourceName: "Reuters",
      sourceUrl: "#",
      publishedAt: "2h ago",
      categoryTag: "Launch",
      summary: "The full-stack Starship vehicle achieved orbit for the first time...",
    },
    {
      id: "2",
      title: "Boeing 737 MAX production ramps up to 38 per month",
      sourceName: "Aviation Week",
      sourceUrl: "#",
      publishedAt: "4h ago",
      categoryTag: "Production",
      summary: "Boeing has increased its 737 MAX production rate...",
    },
    {
      id: "3",
      title: "Airbus secures $50B order from IndiGo for 500 A320neo aircraft",
      sourceName: "Bloomberg",
      sourceUrl: "#",
      publishedAt: "6h ago",
      categoryTag: "Deals",
      summary: "The largest single aircraft order in aviation history...",
    },
  ],
  ai: [
    {
      id: "1",
      title: "OpenAI announces GPT-5 with reasoning capabilities",
      sourceName: "TechCrunch",
      sourceUrl: "#",
      publishedAt: "1h ago",
      categoryTag: "Models",
      summary: "The latest model shows significant improvements in reasoning...",
    },
    {
      id: "2",
      title: "NVIDIA H200 GPU sets new AI training benchmarks",
      sourceName: "The Verge",
      sourceUrl: "#",
      publishedAt: "3h ago",
      categoryTag: "Hardware",
      summary: "New GPU architecture delivers 2x performance improvement...",
    },
  ],
  fintech: [
    {
      id: "1",
      title: "Stripe expands to 10 new markets in Southeast Asia",
      sourceName: "FinExtra",
      sourceUrl: "#",
      publishedAt: "2h ago",
      categoryTag: "Expansion",
      summary: "Payment infrastructure company continues global growth...",
    },
  ],
  ev: [
    {
      id: "1",
      title: "Tesla Cybertruck deliveries exceed 100,000 units",
      sourceName: "Electrek",
      sourceUrl: "#",
      publishedAt: "3h ago",
      categoryTag: "Sales",
      summary: "Stainless steel truck reaches production milestone...",
    },
  ],
  biotech: [
    {
      id: "1",
      title: "Moderna mRNA cancer vaccine shows 50% efficacy in trials",
      sourceName: "STAT News",
      sourceUrl: "#",
      publishedAt: "5h ago",
      categoryTag: "Clinical",
      summary: "Phase 3 trials demonstrate significant tumor reduction...",
    },
  ],
};

const categoryColors: Record<string, string> = {
  Launch: "bg-accent/20 text-accent",
  Production: "bg-emerald-500/20 text-emerald-400",
  Deals: "bg-amber-500/20 text-amber-400",
  Models: "bg-violet-500/20 text-violet-400",
  Hardware: "bg-cyan-500/20 text-cyan-400",
  Expansion: "bg-rose-500/20 text-rose-400",
  Sales: "bg-blue-500/20 text-blue-400",
  Clinical: "bg-pink-500/20 text-pink-400",
  default: "bg-text-muted/20 text-text-muted",
};

interface DailyNewsProps {
  marketId: string;
}

export function DailyNews({ marketId }: DailyNewsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const news = placeholderNews[marketId] || [];

  if (news.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Newspaper size={18} className="text-accent" />
          <h2 className="text-h3 text-text-primary">Daily News</h2>
          <span className="chip-accent text-[10px] ml-1">LIVE</span>
        </div>
        <div className="p-6 rounded-card bg-bg-2/50 border border-border text-center">
          <p className="text-body text-text-muted">News feed coming soon for this market</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap size={16} className="text-accent" />
          </div>
          <h2 className="text-h3 text-text-primary">Daily News</h2>
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
        </div>
        <button className="flex items-center gap-1 text-caption text-text-muted hover:text-accent transition-colors">
          <span>View all</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* News Cards */}
      <div className="space-y-3">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + index * 0.05 }}
            className={cn(
              "group relative p-4 rounded-card bg-bg-2 border border-border",
              "hover:border-text-muted/50 transition-all duration-200",
              "cursor-pointer"
            )}
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            {/* Category & Time */}
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                categoryColors[item.categoryTag] || categoryColors.default
              )}>
                {item.categoryTag}
              </span>
              <div className="flex items-center gap-1 text-caption text-text-muted">
                <Clock size={12} />
                <span>{item.publishedAt}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-body font-medium text-text-primary leading-snug mb-2 group-hover:text-accent transition-colors">
              {item.title}
            </h3>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedId === item.id && item.summary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-caption text-text-secondary mb-3">
                    {item.summary}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Source Footer */}
            <div className="flex items-center justify-between">
              <span className="text-caption text-text-muted">
                via <span className="text-text-secondary">{item.sourceName}</span>
              </span>
              <a
                href={item.sourceUrl}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-caption text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span>Read</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Accent Line */}
            <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-accent/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 p-3 rounded-card bg-gradient-to-r from-accent/5 to-transparent border border-accent/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-caption font-medium text-text-primary">Real-time news coming soon</p>
            <p className="text-[11px] text-text-muted">
              Auto-curated from 50+ industry sources with AI summaries
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
