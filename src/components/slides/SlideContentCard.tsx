import { ExternalLink } from "lucide-react";
import { MentorGuide } from "./MentorGuide";

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
}

export function SlideContentCard({ 
  title, 
  body, 
  sources, 
  slideIndex, 
  totalSlides,
  stackTitle 
}: SlideContentCardProps) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Mentor Guide at top of each slide */}
      <MentorGuide 
        context={stackTitle}
        slideIndex={slideIndex}
        totalSlides={totalSlides}
      />
      
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
