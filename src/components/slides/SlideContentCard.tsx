import { ExternalLink } from "lucide-react";
import { SlideMascotCard, getSlidePosition } from "@/components/mascot/SlideMascotCard";

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
  const slidePosition = getSlidePosition(slideIndex, totalSlides);
  const showMascot = slidePosition !== null;

  // Safeguard: ensure title and body are always strings
  const safeTitle = typeof title === 'string' ? title : String(title ?? '');
  const safeBody = typeof body === 'string' ? body : String(body ?? '');
  const safeSources = Array.isArray(sources)
    ? sources.filter((s) => typeof s?.label === 'string' && typeof s?.url === 'string')
    : [];
  
  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Premium Mascot Card on strategic slides (first, middle, last) */}
      {showMascot && slidePosition && (
        <SlideMascotCard
          position={slidePosition}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
          marketId={marketId}
        />
      )}
      
      {/* Content Card */}
      <div className="card-elevated flex flex-col">
        <h3 className="text-h3 text-text-primary mb-3">{safeTitle}</h3>
        <p className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">
          {safeBody}
        </p>
        
        {/* Sources */}
        {safeSources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {safeSources.map((source, idx) => (
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
