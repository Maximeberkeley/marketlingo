import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MarketCardProps {
  id: string;
  name: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function MarketCard({ id, name, icon: Icon, selected, onSelect }: MarketCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
      className={`relative flex flex-col items-start justify-between h-[120px] p-4 rounded-card transition-all duration-200 no-select ${
        selected
          ? "selected-ring bg-bg-2"
          : "bg-bg-2 border border-border hover:border-text-muted"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-button flex items-center justify-center transition-colors ${
          selected ? "bg-primary/20 text-primary" : "bg-bg-1 text-text-muted"
        }`}
      >
        <Icon size={20} />
      </div>
      <span className="text-h3 text-text-primary">{name}</span>
      
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
