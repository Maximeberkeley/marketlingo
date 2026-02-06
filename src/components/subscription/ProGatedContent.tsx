import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { useContentAccess } from "@/hooks/useContentAccess";
import { useProPromotion } from "@/hooks/useProPromotion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProGatedContentProps {
  children: ReactNode;
  feature: 
    | 'ai_mentor' 
    | 'investment_lab' 
    | 'pro_trainer' 
    | 'advanced_content'
    | 'full_lesson'
    | 'unlimited_games'
    | 'unlimited_drills';
  featureLabel?: string;
  /** Show a preview of the gated content with overlay */
  showPreview?: boolean;
  /** Compact mode for inline gating */
  compact?: boolean;
  /** Custom fallback component */
  fallback?: ReactNode;
}

const featureNames: Record<string, string> = {
  ai_mentor: 'AI Mentor',
  investment_lab: 'Investment Lab',
  pro_trainer: 'Pro Trainer',
  advanced_content: 'Advanced Content',
  full_lesson: 'Full Lesson',
  unlimited_games: 'Unlimited Games',
  unlimited_drills: 'Unlimited Drills',
};

/**
 * Wrapper component that gates content behind Pro subscription.
 * Shows the content if user is Pro, otherwise shows upgrade prompt.
 */
export function ProGatedContent({ 
  children, 
  feature,
  featureLabel,
  showPreview = false,
  compact = false,
  fallback,
}: ProGatedContentProps) {
  const { isProUser, canAccessFeature } = useContentAccess();
  const { triggerFeatureGate } = useProPromotion();
  const navigate = useNavigate();
  
  const label = featureLabel || featureNames[feature] || feature;

  // Check feature access
  const hasAccess = (() => {
    switch (feature) {
      case 'ai_mentor':
        return canAccessFeature('hasAIMentorAccess');
      case 'investment_lab':
        return canAccessFeature('hasInvestmentLabAccess');
      case 'pro_trainer':
        return canAccessFeature('hasProTrainerAccess');
      case 'advanced_content':
        return canAccessFeature('hasAdvancedContent');
      case 'full_lesson':
      case 'unlimited_games':
      case 'unlimited_drills':
        return isProUser;
      default:
        return isProUser;
    }
  })();

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleUnlock = () => {
    triggerFeatureGate(label);
    navigate('/subscription');
  };

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Compact inline gate
  if (compact) {
    return (
      <motion.button
        onClick={handleUnlock}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
          "border border-amber-500/20 hover:border-amber-500/40",
          "transition-all cursor-pointer"
        )}
      >
        <Lock className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-amber-400 font-medium">
          Unlock {label}
        </span>
        <Crown className="w-3 h-3 text-amber-400" />
      </motion.button>
    );
  }

  // Preview mode with overlay
  if (showPreview) {
    return (
      <div className="relative">
        <div className="opacity-30 pointer-events-none blur-[2px]">
          {children}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center",
            "bg-gradient-to-t from-background via-background/80 to-transparent",
            "rounded-xl p-6"
          )}
        >
          <div className="text-center max-w-xs">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
            >
              <Crown className="w-7 h-7 text-white" />
            </motion.div>
            
            <h3 className="text-h3 text-text-primary mb-2">
              {label} is Pro
            </h3>
            <p className="text-caption text-text-secondary mb-4">
              Upgrade to unlock the full learning experience
            </p>
            
            <Button 
              onClick={handleUnlock}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Unlock Pro
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Full gate card
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-6 text-center",
        "bg-gradient-to-br from-bg-2 to-bg-1",
        "border border-border"
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center"
      >
        <Lock className="w-8 h-8 text-amber-400" />
      </motion.div>
      
      <h3 className="text-h3 text-text-primary mb-2">
        {label}
      </h3>
      <p className="text-body text-text-secondary mb-5">
        This feature is available with MarketLingo Pro. Upgrade to unlock the full learning experience.
      </p>
      
      <Button 
        onClick={handleUnlock}
        size="lg"
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white w-full"
      >
        <Crown className="w-5 h-5 mr-2" />
        Upgrade to Pro
      </Button>
    </motion.div>
  );
}

interface ProBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Small badge to indicate Pro-only content
 */
export function ProBadge({ className, size = 'sm' }: ProBadgeProps) {
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
        "text-amber-400 rounded-full",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Crown className={size === 'sm' ? "w-2.5 h-2.5" : "w-3 h-3"} />
      PRO
    </span>
  );
}