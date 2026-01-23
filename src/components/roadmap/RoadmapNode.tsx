import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";

export type NodeStatus = "locked" | "current" | "completed" | "available";

interface RoadmapNodeProps {
  weekNumber: number;
  status: NodeStatus;
  onClick: () => void;
}

export function RoadmapNode({ weekNumber, status, onClick }: RoadmapNodeProps) {
  const isInteractive = status !== "locked";
  
  return (
    <motion.button
      whileTap={isInteractive ? { scale: 0.95 } : undefined}
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      className={`relative no-select ${
        status === "current"
          ? "node-current"
          : status === "completed"
          ? "node-completed"
          : status === "locked"
          ? "node-locked cursor-not-allowed"
          : "node hover:border-text-muted"
      }`}
    >
      {status === "locked" && <Lock size={16} className="text-locked" />}
      {status === "completed" && <Check size={18} className="text-primary-foreground" />}
      {(status === "current" || status === "available") && (
        <span className="text-caption font-semibold text-text-primary">
          {weekNumber}
        </span>
      )}
      
      {status === "current" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full border-2 border-primary"
        />
      )}
    </motion.button>
  );
}
