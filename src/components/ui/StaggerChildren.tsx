import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: (custom: { staggerDelay: number; initialDelay: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.staggerDelay,
      delayChildren: custom.initialDelay,
    },
  }),
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 260, damping: 20 } 
  },
};

export function StaggerChildren({ 
  children, 
  className = "", 
  staggerDelay = 0.06,
  initialDelay = 0.05
}: StaggerChildrenProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      custom={{ staggerDelay, initialDelay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
