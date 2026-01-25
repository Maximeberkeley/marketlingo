import { motion } from "framer-motion";
import { Rocket, Building2, Lightbulb, Target, TrendingUp, Award } from "lucide-react";

interface StartupProgressProps {
  stage: number;
  stageName: string;
  stageDescription: string;
  progress: number;
  totalXP: number;
}

const stageIcons = [
  Lightbulb, // Ideation
  Target,    // Validation
  Rocket,    // MVP
  TrendingUp, // Traction
  Building2, // Scaling
  Award,     // Established
];

export function StartupProgress({ 
  stage, 
  stageName, 
  stageDescription, 
  progress,
  totalXP 
}: StartupProgressProps) {
  const StageIcon = stageIcons[stage - 1] || Lightbulb;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <StageIcon size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-body font-semibold text-text-primary">
              Stage {stage}: {stageName}
            </h3>
          </div>
          <p className="text-caption text-text-muted">{stageDescription}</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-text-muted">Building your startup</span>
          <span className="text-accent font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-bg-1 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent/70"
          />
        </div>
        <p className="text-[10px] text-text-muted text-center mt-1">
          {totalXP.toLocaleString()} XP earned
        </p>
      </div>
    </motion.div>
  );
}
