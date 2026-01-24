import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ExternalLink, Clock, TrendingUp, Zap, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { mentors, Mentor } from "@/data/mentors";

interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  categoryTag: string;
  summary?: string;
}

const categoryColors: Record<string, string> = {
  Space: "bg-purple-500/20 text-purple-400",
  Aviation: "bg-blue-500/20 text-blue-400",
  Defense: "bg-red-500/20 text-red-400",
  Deals: "bg-amber-500/20 text-amber-400",
  Industry: "bg-emerald-500/20 text-emerald-400",
  Launch: "bg-accent/20 text-accent",
  Production: "bg-emerald-500/20 text-emerald-400",
  Models: "bg-violet-500/20 text-violet-400",
  Hardware: "bg-cyan-500/20 text-cyan-400",
  default: "bg-text-muted/20 text-text-muted",
};

interface DailyNewsProps {
  marketId: string;
}

export function DailyNews({ marketId }: DailyNewsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const kaiMentor = mentors.find(m => m.id === "kai")!;

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-aerospace-news');
      
      if (fnError) {
        console.error('Error fetching news:', fnError);
        setError('Unable to load news');
        return;
      }
      
      if (data?.success && data?.data) {
        setNews(data.data);
        setLastFetched(new Date());
      } else {
        setError(data?.error || 'No news available');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to connect to news service');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (marketId === 'aerospace') {
      fetchNews();
    } else {
      setIsLoading(false);
      setNews([]);
    }
  }, [marketId]);

  if (marketId !== 'aerospace') {
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
        <div className="flex items-center gap-3">
          <MentorAvatar
            mentor={kaiMentor}
            onClick={() => setActiveMentor(kaiMentor)}
            size="sm"
            showPulse
          />
          <button 
            onClick={fetchNews}
            disabled={isLoading}
            className="flex items-center gap-1 text-caption text-text-muted hover:text-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-card bg-bg-2 border border-border animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-16 bg-bg-1 rounded-full" />
                <div className="h-3 w-12 bg-bg-1 rounded" />
              </div>
              <div className="h-5 w-full bg-bg-1 rounded mb-2" />
              <div className="h-3 w-24 bg-bg-1 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-6 rounded-card bg-bg-2/50 border border-border text-center">
          <AlertCircle size={24} className="text-text-muted mx-auto mb-2" />
          <p className="text-body text-text-muted mb-3">{error}</p>
          <button
            onClick={fetchNews}
            className="text-accent text-caption hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* News Cards */}
      {!isLoading && !error && news.length > 0 && (
        <div className="space-y-3">
          {news.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + index * 0.05 }}
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
                  target="_blank"
                  rel="noopener noreferrer"
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
      )}

      {/* Empty State */}
      {!isLoading && !error && news.length === 0 && (
        <div className="p-6 rounded-card bg-bg-2/50 border border-border text-center">
          <p className="text-body text-text-muted">No news available right now</p>
        </div>
      )}

      {/* Last Updated */}
      {lastFetched && !isLoading && news.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[11px] text-text-muted text-center mt-4"
        >
          Last updated: {lastFetched.toLocaleTimeString()}
        </motion.p>
      )}

      {/* Mentor Chat Overlay */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={`Daily aerospace news. Recent headlines: ${news.slice(0, 3).map(n => n.title).join('; ')}`}
      />
    </motion.div>
  );
}