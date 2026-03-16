import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsItem } from "./types";

const PLACEHOLDER_GRADIENTS = [
  "from-primary/80 to-primary/40",
  "from-blue-600/80 to-blue-400/40",
  "from-emerald-600/80 to-emerald-400/40",
  "from-amber-600/80 to-amber-400/40",
];

interface FeaturedCarouselProps {
  items: NewsItem[];
  onSelect: (item: NewsItem) => void;
}

export function FeaturedCarousel({ items, onSelect }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative group">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={16} className="text-foreground" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={16} className="text-foreground" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSelect(item)}
            className="snap-start shrink-0 w-[280px] cursor-pointer group/card"
          >
            <div className="relative h-[180px] rounded-2xl overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br",
                  PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length],
                  item.imageUrl ? "hidden" : ""
                )}
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content overlay */}
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <span className="self-start px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm mb-2">
                  {item.categoryTag}
                </span>
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-1">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/70 font-medium">{item.sourceName}</span>
                  <span className="text-[10px] text-white/50">{item.publishedAt}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
