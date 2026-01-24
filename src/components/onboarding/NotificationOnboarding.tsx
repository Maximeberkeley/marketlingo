import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Flame, Newspaper, Clock, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationOnboardingProps {
  open: boolean;
  onComplete: (enabled: boolean) => void;
}

const benefits = [
  {
    icon: Clock,
    title: "Daily Reminders",
    description: "Never miss a lesson with smart reminders at your preferred time",
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
  {
    icon: Flame,
    title: "Streak Protection",
    description: "Get warned before your learning streak expires",
    color: "text-orange-400",
    bgColor: "bg-orange-400/20",
  },
  {
    icon: Newspaper,
    title: "Breaking News",
    description: "Stay ahead with real-time aerospace industry updates",
    color: "text-blue-400",
    bgColor: "bg-blue-400/20",
  },
];

export function NotificationOnboarding({ open, onComplete }: NotificationOnboardingProps) {
  const [step, setStep] = useState(0);
  const [isEnabling, setIsEnabling] = useState(false);
  const { registerPushNotifications, isSupported } = useNotifications();

  const handleEnable = async () => {
    setIsEnabling(true);
    const success = await registerPushNotifications();
    setIsEnabling(false);
    onComplete(success);
  };

  const handleSkip = () => {
    onComplete(false);
  };

  if (!isSupported) {
    // On web, just close the dialog
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-bg-1 border-border max-w-sm mx-auto p-0 overflow-hidden [&>button]:hidden"
      >
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {/* Hero */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mx-auto mb-4"
                >
                  <Bell size={40} className="text-bg-0" />
                </motion.div>
                <h2 className="text-h1 text-text-primary mb-2">Stay on Track</h2>
                <p className="text-body text-text-muted">
                  Enable notifications to get the most out of your aerospace learning journey
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-bg-2 border border-border"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", benefit.bgColor)}>
                      <benefit.icon size={20} className={benefit.color} />
                    </div>
                    <div>
                      <p className="text-body font-medium text-text-primary">{benefit.title}</p>
                      <p className="text-caption text-text-muted">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => setStep(1)}
                  className="w-full bg-accent hover:bg-accent/90 text-bg-0"
                >
                  Continue
                  <ChevronRight size={18} className="ml-2" />
                </Button>
                <button
                  onClick={handleSkip}
                  className="w-full py-2 text-caption text-text-muted hover:text-text-secondary transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="permission"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {/* Permission Request */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring" }}
                  className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4"
                >
                  <Bell size={32} className="text-accent" />
                </motion.div>
                <h2 className="text-h2 text-text-primary mb-2">Allow Notifications</h2>
                <p className="text-body text-text-muted">
                  Tap "Allow" on the next prompt to receive personalized reminders and updates
                </p>
              </div>

              {/* What you'll get */}
              <div className="p-4 rounded-xl bg-bg-2 border border-border mb-6">
                <p className="text-caption text-text-muted mb-3">You'll receive:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-caption text-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Daily lesson reminders at your chosen time
                  </li>
                  <li className="flex items-center gap-2 text-caption text-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Streak expiration warnings
                  </li>
                  <li className="flex items-center gap-2 text-caption text-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Breaking aerospace news (optional)
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleEnable}
                  disabled={isEnabling}
                  className="w-full bg-accent hover:bg-accent/90 text-bg-0"
                >
                  {isEnabling ? "Enabling..." : "Enable Notifications"}
                </Button>
                <button
                  onClick={handleSkip}
                  className="w-full py-2 text-caption text-text-muted hover:text-text-secondary transition-colors"
                >
                  Skip for now
                </button>
              </div>

              {/* Privacy note */}
              <p className="text-center text-[10px] text-text-muted mt-4">
                You can change your preferences anytime in Settings
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
