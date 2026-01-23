import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface StackCardProps {
  title: string;
  subtitle: string;
  headline?: string;
  progress?: number;
  ctaText?: string;
  onClick: () => void;
}

export function StackCard({ 
  title, 
  subtitle, 
  headline, 
  progress, 
  ctaText = "Start",
  onClick 
}: StackCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full card-elevated text-left no-select group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-h3 text-text-primary mb-1">{title}</h3>
          <p className="text-caption text-text-muted">{subtitle}</p>
          
          {headline && (
            <p className="text-body text-text-secondary mt-3 line-clamp-1">
              {headline}
            </p>
          )}
          
          {typeof progress === "number" && (
            <div className="mt-3">
              <div className="progress-thin">
                <div 
                  className="progress-thin-fill" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="ml-4 flex items-center">
          <span className="text-caption text-primary font-medium mr-1 group-hover:mr-2 transition-all">
            {ctaText}
          </span>
          <ChevronRight size={16} className="text-primary" />
        </div>
      </div>
    </motion.button>
  );
}
