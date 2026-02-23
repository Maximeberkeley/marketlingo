import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MilestoneType } from "./MilestoneShareCard";

interface MilestoneImageCardProps {
  visible: boolean;
  type: MilestoneType;
  data: {
    value: number;
    label: string;
    marketName?: string;
    marketEmoji?: string;
    stageName?: string;
    monthName?: string;
    grade?: string;
  };
  onDismiss: () => void;
}

const config: Record<MilestoneType, {
  emoji: string;
  gradient: string;
  accentColor: string;
  getTitle: (v: number) => string;
}> = {
  streak: {
    emoji: "🔥",
    gradient: "from-orange-600 via-amber-500 to-orange-400",
    accentColor: "#F97316",
    getTitle: (v) => `${v}-Day Streak!`,
  },
  level_up: {
    emoji: "⚡",
    gradient: "from-yellow-600 via-yellow-500 to-amber-400",
    accentColor: "#EAB308",
    getTitle: (v) => `Level ${v}`,
  },
  passport_stamp: {
    emoji: "🛂",
    gradient: "from-violet-600 via-purple-500 to-fuchsia-400",
    accentColor: "#8B5CF6",
    getTitle: () => "New Stamp!",
  },
  stage_up: {
    emoji: "🚀",
    gradient: "from-emerald-600 via-green-500 to-teal-400",
    accentColor: "#22C55E",
    getTitle: () => "Stage Up!",
  },
};

export function MilestoneImageCard({ visible, type, data, onDismiss }: MilestoneImageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const c = config[type];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: "#0B1020",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `marketlingo-${type}-${data.value}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded! Share it on LinkedIn or Instagram.");
    } catch {
      toast.error("Download failed. Try again.");
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
            className="w-full max-w-sm space-y-4"
          >
            {/* Exportable card */}
            <div
              ref={cardRef}
              className="rounded-3xl overflow-hidden p-8 text-center relative"
              style={{ background: "linear-gradient(135deg, #0B1020 0%, #1A1F3A 50%, #0B1020 100%)" }}
            >
              {/* Top gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${c.gradient}`} />

              {/* Badge */}
              <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{ background: `${c.accentColor}22`, border: `2px solid ${c.accentColor}55` }}>
                <span className="text-5xl">{c.emoji}</span>
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-1">
                {c.getTitle(data.value)}
              </h2>
              <p className="text-sm text-gray-400 mb-4">{data.label}</p>

              {data.marketEmoji && data.marketName && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span className="text-lg">{data.marketEmoji}</span>
                  <span className="text-sm font-medium text-white">{data.marketName}</span>
                </div>
              )}

              {/* Branding */}
              <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-xs text-gray-500 tracking-widest uppercase">MarketLingo</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
                <Download size={14} /> Download PNG
              </Button>
              <Button variant="default" className="flex-1" onClick={onDismiss}>
                Done
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
