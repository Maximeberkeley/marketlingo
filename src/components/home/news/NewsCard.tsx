import { motion } from "framer-motion";
import { ExternalLink, MessageSquare, FileText, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsItem } from "./types";

const categoryColors: Record<string, string> = {
  Space: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  Aviation: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Defense: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  Deals: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Industry: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Innovation: "bg-primary/10 text-primary",
  Launch: "bg-primary/10 text-primary",
  Models: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  Hardware: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
  Research: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  default: "bg-muted text-muted-foreground",
};

function isHighImpact(title: string, summary?: string): boolean {
  const text = (title + " " + (summary || "")).toLowerCase();
  const signals = ["billion", "acquisition", "merger", "ipo", "fda approval", "breakthrough", "banned", "regulation", "crisis", "record"];
  return signals.some((s) => text.includes(s));
}

interface NewsCardProps {
  item: NewsItem;
  index: number;
  onSelect: (item: NewsItem) => void;
  onAiAction: (item: NewsItem, action: "discuss" | "summarize" | "why") => void;
}

export function NewsCard({ item, index, onSelect, onAiAction }: NewsCardProps) {
  const high = isHighImpact(item.title, item.summary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04 }}
      onClick={() => onSelect(item)}
      className="group cursor-pointer bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="flex gap-3 p-3">
        {/* Image thumbnail */}
        <div className="shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden bg-muted">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileText size={20} className="text-primary/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider",
                categoryColors[item.categoryTag] || categoryColors.default
              )}>
                {item.categoryTag}
              </span>
              {high && (
                <AlertCircle size={12} className="text-destructive" />
              )}
              <span className="text-[10px] text-muted-foreground">{item.publishedAt}</span>
            </div>
            <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">{item.sourceName}</span>
          </div>
        </div>
      </div>

      {/* AI Actions bar */}
      <div className="flex items-center gap-1 px-3 pb-2.5 pt-0">
        <button
          onClick={(e) => { e.stopPropagation(); onAiAction(item, "discuss"); }}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <MessageSquare size={11} />
          <span>Discuss</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAiAction(item, "summarize"); }}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <FileText size={11} />
          <span>Summarize</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAiAction(item, "why"); }}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Lightbulb size={11} />
          <span>Why it matters</span>
        </button>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  );
}
