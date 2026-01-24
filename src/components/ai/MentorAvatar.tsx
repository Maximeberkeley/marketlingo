import { motion } from "framer-motion";
import { Mentor } from "@/data/mentors";
import { cn } from "@/lib/utils";

interface MentorAvatarProps {
  mentor: Mentor;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  showPulse?: boolean;
  showName?: boolean;
  className?: string;
}

export function MentorAvatar({ mentor, size = "md", onClick, showPulse = true, showName = false, className }: MentorAvatarProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2",
        className
      )}
    >
      <div className={cn(
        "relative rounded-full overflow-hidden border-2 border-accent/50 hover:border-accent transition-colors",
        sizes[size]
      )}>
        <img
          src={mentor.avatar}
          alt={mentor.name}
          className="w-full h-full object-cover"
        />
        
        {/* Pulse indicator */}
        {showPulse && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent border border-bg-1" />
            </span>
          </div>
        )}
      </div>
      
      {showName && (
        <div className="text-center">
          <p className="text-caption text-text-primary font-medium">{mentor.name.split(" ")[0]}</p>
          <p className="text-[10px] text-text-muted">{mentor.title}</p>
        </div>
      )}
    </motion.button>
  );
}
