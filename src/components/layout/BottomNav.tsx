import { Home, Map, Dumbbell, BookOpen, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/roadmap", icon: Map, label: "Courses" },
  { path: "/practice", icon: Dumbbell, label: "Practice" },
  { path: "/notebook", icon: BookOpen, label: "Notes" },
  { path: "/profile", icon: User, label: "You" },
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
      <div className="absolute inset-0 bg-background/95 backdrop-blur-lg border-t border-border" />
      
      <div className="relative flex items-center justify-center h-[56px] max-w-md mx-auto px-2">
        <div className="flex items-center justify-around w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === "/practice" && ["/practice", "/trainer", "/games", "/drills"].includes(location.pathname));
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full relative no-select",
                  "transition-colors duration-150"
                )}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                <motion.div 
                  className="relative flex items-center justify-center"
                  animate={isActive ? { y: -1 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon
                    size={22}
                    className={cn(
                      "transition-colors duration-150",
                      isActive ? "text-primary" : "text-text-muted"
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    fill={isActive ? "currentColor" : "none"}
                  />
                </motion.div>
                
                <span
                  className={cn(
                    "text-[10px] mt-0.5 font-semibold transition-colors duration-150",
                    isActive ? "text-primary" : "text-text-muted"
                  )}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
