import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";

export interface FloatingXPProps {
  amount: number;
  show: boolean;
  isPro?: boolean;
}

export function FloatingXP({ amount, show, isPro = false }: FloatingXPProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && amount > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [show, amount]);

  const displayAmount = isPro ? Math.round(amount * 1.5) : amount;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.7 }}
          animate={{ opacity: 1, y: -40, scale: 1 }}
          exit={{ opacity: 0, y: -80, scale: 0.5 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="fixed top-20 right-6 z-[200] pointer-events-none flex items-center gap-1.5 bg-accent/90 text-white px-4 py-2 rounded-full shadow-lg"
        >
          <Zap size={16} className="text-yellow-300" />
          <span className="text-lg font-black">+{displayAmount} XP</span>
          {isPro && <span className="text-xs font-bold opacity-80">1.5×</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
