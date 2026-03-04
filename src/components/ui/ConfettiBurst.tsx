import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "hsl(258 90% 66%)",   // purple
  "hsl(142 71% 45%)",   // green
  "hsl(25 95% 53%)",    // orange
  "hsl(199 89% 48%)",   // cyan
  "hsl(330 81% 60%)",   // pink
  "hsl(48 96% 53%)",    // yellow
];

interface ConfettiBurstProps {
  show: boolean;
  count?: number;
}

export function ConfettiBurst({ show, count = 24 }: ConfettiBurstProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * 360;
            const radius = 200 + Math.random() * 300;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius - 200;
            const size = 6 + Math.random() * 8;
            const isCircle = Math.random() > 0.5;
            
            return (
              <motion.div
                key={i}
                initial={{
                  x: "50vw",
                  y: "40vh",
                  scale: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `calc(50vw + ${x}px)`,
                  y: `calc(40vh + ${y}px + 100vh)`,
                  scale: [0, 1.5, 1],
                  rotate: Math.random() * 720 - 360,
                  opacity: [0, 1, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.8 + Math.random() * 0.8,
                  delay: i * 0.02,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  position: "absolute",
                  width: size,
                  height: isCircle ? size : size * 2.5,
                  borderRadius: isCircle ? "50%" : "2px",
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
