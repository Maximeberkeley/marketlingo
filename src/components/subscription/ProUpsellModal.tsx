import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Infinity, Brain, Sparkles, TrendingUp, Check, Gift, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription, TRIAL_DURATION_DAYS } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type PromoTrigger = 'lesson_complete' | 'feature_gate' | 'random' | 'low_engagement' | 'manual';

interface ProUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: PromoTrigger | null;
  featureName?: string;
}

const triggerContent: Record<PromoTrigger, {
  headline: string;
  subheadline: string;
  emoji: string;
}> = {
  lesson_complete: {
    headline: "You're crushing it! 🔥",
    subheadline: "Keep the momentum going with unlimited Pro access",
    emoji: "🚀",
  },
  feature_gate: {
    headline: "Unlock This Pro Feature",
    subheadline: "Get access to advanced tools that accelerate your learning",
    emoji: "🔓",
  },
  random: {
    headline: "Ready to Level Up?",
    subheadline: "Join serious learners mastering deep-tech markets",
    emoji: "⚡",
  },
  low_engagement: {
    headline: "We Saved Your Spot!",
    subheadline: "Come back stronger with full Pro access",
    emoji: "👋",
  },
  manual: {
    headline: "Go Pro Today",
    subheadline: "Unlock the complete MarketLingo experience",
    emoji: "👑",
  },
};

const compactBenefits = [
  { icon: Infinity, text: "Unlimited lessons & games" },
  { icon: TrendingUp, text: "Investment Lab access" },
  { icon: Brain, text: "AI mentors on-demand" },
  { icon: Target, text: "Pro Trainer scenarios" },
];

export function ProUpsellModal({ isOpen, onClose, trigger = 'manual', featureName }: ProUpsellModalProps) {
  const { canStartTrial, startFreeTrial, getPackage } = useSubscription();
  const navigate = useNavigate();
  
  const content = trigger ? triggerContent[trigger] : triggerContent.manual;
  
  const handleStartTrial = () => {
    const success = startFreeTrial();
    if (success) {
      toast.success("🎉 Your 7-day Pro trial has started!", {
        description: "Explore all Pro features - no credit card required"
      });
      onClose();
    }
  };
  
  const handleViewPlans = () => {
    onClose();
    navigate('/subscription');
  };

  const monthlyPrice = getPackage('monthly')?.product?.priceString || '$9.99/mo';
  const annualPrice = getPackage('annual')?.product?.priceString || '$79.99/yr';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-t-[24px] sm:rounded-[24px]",
              "bg-bg-1 border border-border shadow-2xl",
              "max-h-[85vh] overflow-y-auto"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-bg-2/80 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with gradient */}
            <div className="relative h-32 flex items-center justify-center bg-gradient-to-br from-accent via-purple-600 to-pink-500">
              <div className="absolute inset-0 bg-black/10" />
              
              {/* Floating particles */}
              <motion.div
                animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-6 left-8"
              >
                <Sparkles className="w-5 h-5 text-white/40" />
              </motion.div>
              <motion.div
                animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute bottom-8 right-10"
              >
                <Zap className="w-4 h-4 text-white/30" />
              </motion.div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", damping: 15 }}
                className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                {canStartTrial ? (
                  <Gift className="w-10 h-10 text-white" />
                ) : (
                  <Crown className="w-10 h-10 text-white" />
                )}
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 modal-bottom-safe">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center mb-5"
              >
                <h2 className="text-xl font-bold text-text-primary mb-1">{content.headline}</h2>
                <p className="text-body text-text-secondary">{content.subheadline}</p>
                {featureName && trigger === 'feature_gate' && (
                  <p className="text-sm text-accent mt-2">
                    "{featureName}" requires Pro
                  </p>
                )}
              </motion.div>

              {/* Compact benefits */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-2 mb-5"
              >
                {compactBenefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-bg-2/50"
                  >
                    <benefit.icon className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-xs text-text-secondary">{benefit.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {canStartTrial ? (
                  <>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      onClick={handleStartTrial}
                      className={cn(
                        "w-full py-4 px-6 rounded-[14px] font-semibold text-white",
                        "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
                        "hover:opacity-90 transition-opacity",
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      <Gift className="w-5 h-5" />
                      Try {TRIAL_DURATION_DAYS} Days Free
                    </motion.button>
                    
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      onClick={handleViewPlans}
                      className="w-full py-3 text-center text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      View pricing plans
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      onClick={handleViewPlans}
                      className={cn(
                        "w-full py-4 px-6 rounded-[14px] font-semibold text-white",
                        "bg-gradient-to-r from-amber-500 to-orange-500",
                        "hover:opacity-90 transition-opacity",
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      <Crown className="w-5 h-5" />
                      Upgrade to Pro
                    </motion.button>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      className="text-center text-xs text-text-muted"
                    >
                      Starting at {monthlyPrice} • Cancel anytime
                    </motion.p>
                  </>
                )}
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={onClose}
                  className="w-full py-2 text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  Maybe later
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
