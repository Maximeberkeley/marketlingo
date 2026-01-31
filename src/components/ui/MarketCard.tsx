import { motion } from "framer-motion";
import { 
  Cpu, Building2, Car, Pill, Zap, Smartphone, 
  Wheat, Plane, Palette, ShoppingBag, Gamepad2, Brain, LucideIcon 
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  cpu: Cpu,
  banknote: Building2,
  zap: Zap,
  pill: Pill,
  sun: Zap,
  smartphone: Smartphone,
  leaf: Wheat,
  rocket: Plane,
  palette: Palette,
  "shopping-cart": ShoppingBag,
  "gamepad-2": Gamepad2,
  brain: Brain,
};

interface MarketCardProps {
  id: string;
  name: string;
  icon: string | LucideIcon;
  isSelected?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onSelect?: (id: string) => void;
}

export function MarketCard({ 
  id, 
  name, 
  icon, 
  isSelected, 
  selected,
  onClick,
  onSelect 
}: MarketCardProps) {
  const isActive = isSelected ?? selected ?? false;
  
  // Handle both string icons and LucideIcon components
  const IconComponent = typeof icon === "string" ? iconMap[icon] || Cpu : icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onSelect) {
      onSelect(id);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-between h-[120px] w-full p-4 rounded-card transition-all duration-200 no-select ${
        isActive
          ? "selected-ring bg-bg-2"
          : "bg-bg-2 border border-border hover:border-text-muted"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-button flex items-center justify-center transition-colors ${
          isActive ? "bg-primary/20 text-primary" : "bg-bg-1 text-text-muted"
        }`}
      >
        <IconComponent size={20} />
      </div>
      <span className="text-h3 text-text-primary text-center">{name}</span>
      
      {isActive && (
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
