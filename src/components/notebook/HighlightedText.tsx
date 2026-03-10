import { cn } from "@/lib/utils";

const HIGHLIGHT_COLORS = [
  { bg: "bg-yellow-500/25", text: "text-yellow-300", border: "border-yellow-500/40", label: "text-yellow-400", dot: "bg-yellow-400" },
  { bg: "bg-cyan-500/25", text: "text-cyan-300", border: "border-cyan-500/40", label: "text-cyan-400", dot: "bg-cyan-400" },
  { bg: "bg-pink-500/25", text: "text-pink-300", border: "border-pink-500/40", label: "text-pink-400", dot: "bg-pink-400" },
  { bg: "bg-green-500/25", text: "text-green-300", border: "border-green-500/40", label: "text-green-400", dot: "bg-green-400" },
  { bg: "bg-orange-500/25", text: "text-orange-300", border: "border-orange-500/40", label: "text-orange-400", dot: "bg-orange-400" },
];

export function getSearchTerms(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 5); // max 5 terms
}

export function getTermColor(index: number) {
  return HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
}

export function countTermMatches(text: string, terms: string[]): number[] {
  const lower = text.toLowerCase();
  return terms.map((term) => {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return (lower.match(re) || []).length;
  });
}

export function noteMatchesAnyTerm(text: string, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

interface HighlightedTextProps {
  text: string;
  terms: string[];
  className?: string;
  maxLines?: number;
}

export function HighlightedText({ text, terms, className, maxLines }: HighlightedTextProps) {
  if (terms.length === 0) {
    return <span className={cn(maxLines && `line-clamp-${maxLines}`, className)}>{text}</span>;
  }

  // Build regex from all terms
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={cn(maxLines && `line-clamp-${maxLines}`, className)}>
      {parts.map((part, i) => {
        const termIndex = terms.findIndex((t) => t.toLowerCase() === part.toLowerCase());
        if (termIndex >= 0) {
          const color = getTermColor(termIndex);
          return (
            <mark key={i} className={cn("rounded px-0.5 font-semibold", color.bg, color.text)}>
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

interface SearchTermChipsProps {
  terms: string[];
  matchCounts: number[];
}

export function SearchTermChips({ terms, matchCounts }: SearchTermChipsProps) {
  if (terms.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {terms.map((term, i) => {
        const color = getTermColor(i);
        return (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
              color.bg, color.label, color.border
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", color.dot)} />
            {term}
            <span className="opacity-70">({matchCounts[i]})</span>
          </span>
        );
      })}
    </div>
  );
}
