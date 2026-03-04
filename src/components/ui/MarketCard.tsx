import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getMarketIllustration } from "@/data/marketIllustrations";
import { 
  Cpu, Building2, Car, Pill, Zap, Smartphone, 
  Wheat, Plane, Palette, ShoppingBag, Gamepad2, Brain, LucideIcon 
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  cpu: Cpu, banknote: Building2, zap: Zap, pill: Pill, sun: Zap,
  smartphone: Smartphone, leaf: Wheat, rocket: Plane, palette: Palette,
  "shopping-cart": ShoppingBag, "gamepad-2": Gamepad2, brain: Brain,
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

export function MarketCard({ id, name, icon, isSelected, selected, onClick, onSelect }: MarketCardProps) {
  const isActive = isSelected ?? selected ?? false;
  const illustration = getMarketIllustration(id);

  const handleClick = () => {
    if (onClick) onClick();
    else if (onSelect) onSelect(id);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={cn(
        "relative flex flex-col items-center justify-between h-[140px] w-full p-4 rounded-2xl transition-all duration-200 no-select border bg-card shadow-card",
        isActive ? "selected-ring" : "border-border hover:border-primary/20"
      )}
    >
      <img src={illustration} alt={name} className="w-16 h-16 object-contain" />
      <span className="text-[14px] font-semibold text-text-primary text-center leading-tight">{name}</span>
      
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
