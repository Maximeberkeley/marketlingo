import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Infinity, Brain, Sparkles, TrendingUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

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
}> = {
  lesson_complete: {
    headline: "You're on a roll! 🔥",
    subheadline: "Unlock unlimited learning to keep the momentum going",
  },
  feature_gate: {
    headline: "This is a Pro feature",
    subheadline: "Upgrade to access advanced learning tools",
  },
  random: {
    headline: "Ready to level up?",
    subheadline: "Join Pro learners mastering deep-tech markets",
  },
  low_engagement: {
    headline: "We miss you! 👋",
    subheadline: "Come back stronger with unlimited Pro access",
  },
  manual: {
    headline: "Go Pro",
    subheadline: "Unlock the full MarketLingo experience",
  },
};

const benefits = [
  {
    icon: Infinity,
    title: "Unlimited Access",
    description: "No daily limits on lessons, games & drills",
  },
  {
    icon: TrendingUp,
    title: "Investment Lab",
    description: "Expert-level scenarios & certification",
  },
  {
    icon: Brain,
    title: "AI Mentor",
    description: "Unlimited conversations with mentors",
  },
  {
    icon: Sparkles,
    title: "Premium Experience",
    description: "Priority content & exclusive insights",
  },
];

export function ProUpsellModal({ isOpen, onClose, trigger = 'manual', featureName }: ProUpsellModalProps) {
  const { offerings, isNative } = useSubscription();
  const navigate = useNavigate();
  
  const content = trigger ? triggerContent[trigger] : triggerContent.manual;
  
  const handleUpgrade = () => {
    onClose();
    navigate('/subscription');
  };

  // Get pricing from offerings or show defaults
  const monthlyPrice = offerings?.availablePackages?.find(p => p.identifier === 'monthly')?.product?.priceString || '$9.99/mo';
  const annualPrice = offerings?.availablePackages?.find(p => p.identifier === 'annual')?.product?.priceString || '$79.99/yr';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-t-[24px] sm:rounded-[24px]",
              "bg-bg-1 border border-border shadow-2xl"
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

            {/* Gradient Header with Crown */}
            <div className="relative h-36 flex items-center justify-center bg-gradient-to-br from-accent via-purple-600 to-pink-500">
              <div className="absolute inset-0 bg-black/10" />
              
              {/* Sparkle effects */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="absolute top-6 left-8"
              >
                <Sparkles className="w-5 h-5 text-white/40" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, rotate: 45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute bottom-8 right-10"
              >
                <Sparkles className="w-4 h-4 text-white/30" />
              </motion.div>

              {/* Crown icon */}
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", damping: 15 }}
                className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center mb-5"
              >
                <h2 className="text-h2 text-text-primary mb-1">{content.headline}</h2>
                <p className="text-body text-text-secondary">{content.subheadline}</p>
              </motion.div>

              {/* Benefits list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-3 mb-6"
              >
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                      <benefit.icon className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{benefit.title}</p>
                      <p className="text-caption text-text-secondary">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pricing hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-caption text-text-muted mb-4"
              >
                Starting at {monthlyPrice} • Cancel anytime
              </motion.p>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  onClick={handleUpgrade}
                  className={cn(
                    "w-full py-4 px-6 rounded-[14px] font-semibold text-white",
                    "bg-gradient-to-r from-accent via-purple-600 to-pink-500",
                    "hover:opacity-90 transition-opacity",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  <Crown className="w-5 h-5" />
                  Try Pro Free
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={onClose}
                  className="w-full py-3 text-center text-sm text-text-secondary hover:text-text-primary transition-colors"
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
