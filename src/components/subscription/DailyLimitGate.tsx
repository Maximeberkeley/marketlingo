import { motion } from "framer-motion";
import { Lock, Crown, Sparkles, Clock, ArrowRight } from "lucide-react";
import { useContentAccess } from "@/hooks/useContentAccess";
import { useSubscription, TRIAL_DURATION_DAYS } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DailyLimitGateProps {
  type: 'games' | 'drills' | 'trainer';
  onContinue?: () => void;
}

const typeLabels = {
  games: 'games',
  drills: 'drills',
  trainer: 'trainer scenarios',
};

const typeIcons = {
  games: '🎯',
  drills: '⚡',
  trainer: '🧠',
};

/**
 * Component shown when user hits their daily limit for free tier
 */
export function DailyLimitGate({ type, onContinue }: DailyLimitGateProps) {
  const { checkDailyLimit } = useContentAccess();
  const { canStartTrial, startFreeTrial } = useSubscription();
  const navigate = useNavigate();
  
  const limitInfo = checkDailyLimit(type);
  const label = typeLabels[type];
  const icon = typeIcons[type];

  const handleStartTrial = () => {
    const success = startFreeTrial();
    if (success && onContinue) {
      onContinue();
    }
  };

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl p-6 text-center",
        "bg-gradient-to-br from-bg-2 to-bg-1",
        "border border-border"
      )}
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="text-4xl mb-4"
      >
        {icon}
      </motion.div>
      
      <h3 className="text-h3 text-text-primary mb-2">
        Daily Limit Reached
      </h3>
      <p className="text-body text-text-secondary mb-2">
        You've used all {limitInfo.limit} free {label} for today.
      </p>
      
      <div className="flex items-center justify-center gap-2 text-caption text-text-muted mb-5">
        <Clock className="w-4 h-4" />
        <span>Resets at midnight</span>
      </div>
      
      <div className="space-y-3">
        {canStartTrial ? (
          <Button 
            onClick={handleStartTrial}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-full"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Try {TRIAL_DURATION_DAYS} Days Free
          </Button>
        ) : (
          <Button 
            onClick={handleUpgrade}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white w-full"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade for Unlimited
          </Button>
        )}
        
        <p className="text-[11px] text-text-muted">
          Pro members get unlimited {label} every day
        </p>
      </div>
    </motion.div>
  );
}

interface RemainingCountProps {
  type: 'games' | 'drills' | 'trainer';
  className?: string;
}

/**
 * Shows remaining count for free users
 */
export function RemainingCount({ type, className }: RemainingCountProps) {
  const { checkDailyLimit, isProUser } = useContentAccess();
  
  if (isProUser) return null;
  
  const { remaining, limit } = checkDailyLimit(type);
  
  if (remaining === limit) return null; // Don't show if at full
  
  return (
    <span className={cn(
      "text-caption",
      remaining <= 1 ? "text-amber-400" : "text-text-muted",
      className
    )}>
      {remaining}/{limit} left today
    </span>
  );
}