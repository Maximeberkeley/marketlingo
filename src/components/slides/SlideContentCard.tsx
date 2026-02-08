import { ExternalLink } from "lucide-react";
import { InlineMascot, shouldShowMascotBreak } from "@/components/mascot";
import { useMemo } from "react";

interface Source {
  label: string;
  url: string;
}

interface SlideContentCardProps {
  title: string;
  body: string;
  sources: Source[];
  slideIndex: number;
  totalSlides: number;
  stackTitle: string;
  marketId?: string;
}

// Get an encouraging message based on position
const getPositionalMessage = (slideIndex: number, totalSlides: number): string | undefined => {
  const midpoint = Math.floor(totalSlides / 2);
  
  if (slideIndex === 0) {
    const messages = ["Let's dive in!", "Here we go!", "Ready? Let's learn!"];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (slideIndex === midpoint && totalSlides > 4) {
    const messages = ["Halfway there! 💪", "Great progress!", "Keep it up!"];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (slideIndex === totalSlides - 1) {
    const messages = ["Almost done! 🎉", "Final insights!", "You got this!"];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  return undefined;
};

export function SlideContentCard({ 
  title, 
  body, 
  sources, 
  slideIndex, 
  totalSlides,
  stackTitle,
  marketId
}: SlideContentCardProps) {
  // Determine if this slide should have a mascot
  const mascotBreakType = shouldShowMascotBreak(slideIndex, totalSlides, false);
  const showMascot = mascotBreakType !== null;
  
  // Memoize the message so it doesn't change on re-renders
  const mascotMessage = useMemo(
    () => showMascot ? getPositionalMessage(slideIndex, totalSlides) : undefined,
    [slideIndex, totalSlides, showMascot]
  );
  
  // Position alternates based on slide
  const mascotPosition = slideIndex % 2 === 0 ? "left" : "right";
  
  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Inline Mascot on strategic slides (first, middle, last) */}
      {showMascot && (
        <InlineMascot 
          marketId={marketId}
          message={mascotMessage}
          position={mascotPosition as "left" | "right"}
          size="md"
        />
      )}
      
      {/* Content Card */}
      <div className="card-elevated flex flex-col">
        <h3 className="text-h3 text-text-primary mb-3">{title}</h3>
        <p className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">
          {body}
        </p>
        
        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip inline-flex items-center gap-1.5 hover:border-primary transition-colors"
                >
                  <span>{source.label}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
