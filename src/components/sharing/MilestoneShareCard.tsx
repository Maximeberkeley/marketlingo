import { motion, AnimatePresence } from "framer-motion";
import { X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type MilestoneType = "streak" | "level_up" | "passport_stamp" | "stage_up";

interface MilestoneData {
  value: number;
  label: string;
  marketName?: string;
  marketEmoji?: string;
  stageName?: string;
  monthName?: string;
  grade?: string;
}

interface MilestoneShareCardProps {
  visible: boolean;
  type: MilestoneType;
  data: MilestoneData;
  onDismiss: () => void;
}

const config: Record<MilestoneType, {
  emoji: string;
  gradient: string;
  getTitle: (v: number) => string;
  getSubtitle: (d: any) => string;
}> = {
  streak: {
    emoji: "🔥",
    gradient: "from-orange-500/20 to-orange-600/5",
    getTitle: (v) => `${v}-Day Streak!`,
    getSubtitle: () => "Consistency is the ultimate superpower",
  },
  level_up: {
    emoji: "⚡",
    gradient: "from-yellow-500/20 to-yellow-600/5",
    getTitle: (v) => `Level ${v} Reached!`,
    getSubtitle: () => "Knowledge compounds like interest",
  },
  passport_stamp: {
    emoji: "🛂",
    gradient: "from-accent/20 to-accent/5",
    getTitle: () => "New Stamp Earned!",
    getSubtitle: (d) => d.monthName ? `Completed: ${d.monthName}` : "Another month mastered",
  },
  stage_up: {
    emoji: "🚀",
    gradient: "from-green-500/20 to-green-600/5",
    getTitle: () => "Stage Unlocked!",
    getSubtitle: (d) => d.stageName || "Moving up the ranks",
  },
};

export function MilestoneShareCard({ visible, type, data, onDismiss }: MilestoneShareCardProps) {
  const c = config[type];

  const handleShare = async () => {
    const marketInfo = data.marketEmoji && data.marketName ? `${data.marketEmoji} ${data.marketName}` : "";
    let text = "";
    switch (type) {
      case "streak":
        text = `🔥 ${data.value}-day learning streak in ${marketInfo}!\n\nConsistency > intensity. Studying markets daily with MarketLingo 💜`;
        break;
      case "level_up":
        text = `⚡ Just hit Level ${data.value} in ${marketInfo}!\n\nKnowledge compounds. Learning with MarketLingo 💜`;
        break;
      case "passport_stamp":
        text = `🛂 Earned my "${data.monthName}" passport stamp in ${marketInfo}! Grade: ${data.grade || "A"}\n\nBuilding industry expertise with MarketLingo 💜`;
        break;
      case "stage_up":
        text = `🚀 Unlocked the "${data.stageName}" stage in ${marketInfo}!\n\nLeveling up with MarketLingo 💜`;
        break;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard! Paste it on LinkedIn or Instagram.");
    } catch {
      toast.error("Couldn't copy. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-bg-2 border border-border p-7 text-center relative"
          >
            <button onClick={onDismiss} className="absolute top-3 right-3 p-1 text-text-muted">
              <X size={16} />
            </button>

            {/* Badge */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-b ${c.gradient} flex items-center justify-center mx-auto mb-4 border border-border`}>
              <span className="text-4xl">{c.emoji}</span>
            </div>

            <h2 className="text-h2 text-text-primary font-extrabold mb-1">
              {c.getTitle(data.value)}
            </h2>
            <p className="text-body text-text-secondary mb-4">
              {c.getSubtitle(data)}
            </p>

            {data.marketEmoji && data.marketName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-1 border border-border mb-4">
                <span>{data.marketEmoji}</span>
                <span className="text-caption text-text-primary font-medium">{data.marketName}</span>
              </div>
            )}

            <div className={`bg-gradient-to-r ${c.gradient} rounded-xl py-2.5 px-5 mb-6 inline-block`}>
              <span className="text-body font-bold text-text-primary">{data.label}</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                variant="outline"
                className="w-full border-accent/30 text-accent hover:bg-accent/10"
                onClick={handleShare}
              >
                <Share2 size={14} className="mr-2" />
                Share on LinkedIn / Instagram
              </Button>
              <Button size="full" onClick={onDismiss}>
                Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
