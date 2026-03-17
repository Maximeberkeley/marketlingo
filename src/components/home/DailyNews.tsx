import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, AlertCircle, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNewsData } from "./news/useNewsData";
import { FeaturedCarousel } from "./news/FeaturedCarousel";
import { NewsCard } from "./news/NewsCard";
import { ArticleDetailSheet } from "./news/ArticleDetailSheet";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { mentors, Mentor } from "@/data/mentors";
import { NewsItem } from "./news/types";

interface DailyNewsProps {
  marketId: string;
}

export function DailyNews({ marketId }: DailyNewsProps) {
  const { news, isLoading, error, refresh } = useNewsData(marketId);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [mentorContext, setMentorContext] = useState("");

  const kaiMentor = mentors.find((m) => m.id === "kai")!;
  // If few items, skip carousel and show all in feed; otherwise split 3 featured + rest
  const hasEnoughForCarousel = news.length > 3;
  const featured = hasEnoughForCarousel ? news.slice(0, 3) : [];
  const feed = hasEnoughForCarousel ? news.slice(3) : news;

  const handleAiAction = (item: NewsItem, action: "discuss" | "summarize" | "why") => {
    const prompts: Record<string, string> = {
      discuss: `Let's discuss this article: "${item.title}" from ${item.sourceName}. ${item.summary || ""}`,
      summarize: `Please summarize this article: "${item.title}". ${item.summary || ""}`,
      why: `Why does this matter for the ${marketId} industry? Article: "${item.title}". ${item.summary || ""}`,
    };
    setMentorContext(prompts[action]);
    setActiveMentor(kaiMentor);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Newspaper size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Industry Intel</h2>
            <p className="text-[10px] text-muted-foreground">
              AI-curated news for your market
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {/* Carousel skeleton */}
          <div className="flex gap-3 overflow-hidden -mx-4 px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-[280px] h-[180px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
          {/* Cards skeleton */}
          {[1, 2].map((i) => (
            <div key={i} className="h-[110px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="p-8 rounded-2xl bg-muted/50 border border-border text-center">
          <AlertCircle size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <button onClick={refresh} className="text-primary text-xs font-medium hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && news.length > 0 && (
        <div className="space-y-4">
          {/* Featured carousel */}
          {featured.length > 0 && (
            <FeaturedCarousel items={featured} onSelect={setSelectedArticle} />
          )}

          {/* Feed */}
          {feed.length > 0 && (
            <div className="space-y-2.5">
              {feed.map((item, i) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  index={i}
                  onSelect={setSelectedArticle}
                  onAiAction={handleAiAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && news.length === 0 && (
        <div className="p-8 rounded-2xl bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">No news available right now</p>
        </div>
      )}

      {/* Article Detail Sheet */}
      <ArticleDetailSheet
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        marketId={marketId}
      />

      {/* Mentor Chat Overlay */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={mentorContext}
        marketId={marketId}
      />
    </motion.div>
  );
}
