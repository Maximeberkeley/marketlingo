import { Home, Map, BookOpen, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/roadmap", icon: Map, label: "Roadmap" },
  { path: "/notebook", icon: BookOpen, label: "Notebook" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-1/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-16 h-full relative no-select"
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-text-muted"
                  }`}
                />
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </div>
              <span
                className={`text-caption mt-1 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
