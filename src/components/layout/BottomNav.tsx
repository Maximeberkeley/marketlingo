import { Home, Map, BookOpen, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/roadmap", icon: Map, label: "Roadmap" },
  { path: "/notebook", icon: BookOpen, label: "Notebook" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    hapticFeedback("light");
    navigate(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-bg-1/90 backdrop-blur-xl border-t border-white/5" />
      
      <div className="relative flex items-center justify-center h-16 max-w-md mx-auto px-4">
        <div className="flex items-center justify-around w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full relative no-select",
                  "transition-colors duration-200"
                )}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="navActiveBg"
                    className="absolute inset-x-2 top-1 bottom-1 rounded-xl bg-accent/15"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon
                      size={22}
                      className={cn(
                        "transition-all duration-200",
                        isActive 
                          ? "text-accent drop-shadow-[0_0_8px_rgba(124,92,255,0.5)]" 
                          : "text-text-muted"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </motion.div>
                </div>
                
                <motion.span
                  animate={isActive ? { y: [0, -1, 0] } : {}}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "text-[10px] mt-1 font-medium transition-all duration-200",
                    isActive ? "text-accent" : "text-text-muted"
                  )}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
