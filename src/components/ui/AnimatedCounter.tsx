import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatFn?: (v: number) => string;
}

export function AnimatedCounter({ 
  value, 
  duration = 0.8, 
  className = "",
  formatFn = (v) => Math.round(v).toLocaleString()
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => formatFn(v));
  const [displayValue, setDisplayValue] = useState(formatFn(0));

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on("change", (v) => setDisplayValue(v));
    return unsubscribe;
  }, [value, spring, display]);

  return (
    <motion.span 
      className={className}
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {displayValue}
    </motion.span>
  );
}
