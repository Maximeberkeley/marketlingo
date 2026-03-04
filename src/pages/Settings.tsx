import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Bell, Info, LogOut, ChevronRight, Shield, Rocket, Wrench, Crown, Sparkles, Moon, Sun } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

type SettingsSection = "main" | "notifications" | "about";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isProUser, isLoading: subscriptionLoading, toggleProForTesting, isNative } = useSubscription();
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "notifications":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setActiveSection("main")}
              className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-4"
            >
              <ArrowLeft size={18} />
              <span className="text-caption">Back to Settings</span>
            </button>
            <NotificationSettings />
          </motion.div>
        );
      
      case "about":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setActiveSection("main")}
              className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-4"
            >
              <ArrowLeft size={18} />
              <span className="text-caption">Back to Settings</span>
            </button>
            
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Rocket size={40} className="text-accent" />
              </div>
              <h2 className="text-h2 text-text-primary mb-2">MarketLingo</h2>
              <p className="text-body text-text-muted mb-6">Aerospace Edition</p>
              
              <div className="space-y-3 text-left max-w-sm mx-auto">
                <div className="p-4 rounded-card bg-bg-2 border border-border">
                  <p className="text-caption text-text-muted mb-1">Program Duration</p>
                  <p className="text-body text-text-primary font-medium">6 Months (180 days)</p>
                </div>
                <div className="p-4 rounded-card bg-bg-2 border border-border">
                  <p className="text-caption text-text-muted mb-1">Version</p>
                  <p className="text-body text-text-primary font-medium">1.0.0</p>
                </div>
                <div className="p-4 rounded-card bg-bg-2 border border-border">
                  <p className="text-caption text-text-muted mb-1">Industry Focus</p>
                  <p className="text-body text-text-primary font-medium">Aerospace & Defense</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Profile Section */}
            <div className="p-4 rounded-card bg-bg-2 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <User size={24} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-body font-medium text-text-primary">
                      {user?.email || "User"}
                    </p>
                    {isProUser && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-accent to-purple-600 text-white text-[10px] font-medium">
                        <Crown size={10} />
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-text-muted">
                    {isProUser ? "Pro Member" : "Free Plan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <button
              onClick={() => navigate("/subscription")}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-card",
                isProUser 
                  ? "bg-gradient-to-r from-accent/10 to-purple-600/10 border border-accent/30"
                  : "bg-bg-2 border border-border hover:border-accent/30",
                "transition-all"
              )}
            >
              <div className="flex items-center gap-3">
                {isProUser ? (
                  <Sparkles size={20} className="text-accent" />
                ) : (
                  <Crown size={20} className="text-amber-400" />
                )}
                <div className="text-left">
                  <p className="text-body font-medium text-text-primary">
                    {isProUser ? "Manage Subscription" : "Upgrade to Pro"}
                  </p>
                  <p className="text-caption text-text-muted">
                    {isProUser ? "View plan & billing" : "Unlock all features"}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </button>

            {/* Settings Options */}
            <div className="space-y-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-card",
                  "bg-bg-2 border border-border hover:border-accent/30",
                  "transition-all"
                )}
              >
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon size={20} className="text-accent" /> : <Sun size={20} className="text-accent" />}
                  <div className="text-left">
                    <p className="text-body font-medium text-text-primary">Appearance</p>
                    <p className="text-caption text-text-muted">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-6 rounded-full relative transition-colors",
                  theme === "dark" ? "bg-accent" : "bg-border"
                )}>
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    theme === "dark" ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
              </button>

              <button
                onClick={() => setActiveSection("notifications")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-card",
                  "bg-bg-2 border border-border hover:border-accent/30",
                  "transition-all"
                )}
              >
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-accent" />
                  <div className="text-left">
                    <p className="text-body font-medium text-text-primary">Notifications</p>
                    <p className="text-caption text-text-muted">Daily reminders & news alerts</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-muted" />
              </button>

              <button
                onClick={() => navigate("/select-market")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-card",
                  "bg-bg-2 border border-border hover:border-accent/30",
                  "transition-all"
                )}
              >
                <div className="flex items-center gap-3">
                  <Rocket size={20} className="text-accent" />
                  <div className="text-left">
                    <p className="text-body font-medium text-text-primary">Change Industry</p>
                    <p className="text-caption text-text-muted">Currently: Aerospace</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-muted" />
              </button>

              <button
                onClick={() => setActiveSection("about")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-card",
                  "bg-bg-2 border border-border hover:border-accent/30",
                  "transition-all"
                )}
              >
                <div className="flex items-center gap-3">
                  <Info size={20} className="text-accent" />
                  <div className="text-left">
                    <p className="text-body font-medium text-text-primary">About</p>
                    <p className="text-caption text-text-muted">Version & program info</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-muted" />
              </button>

              <button
                onClick={() => navigate("/admin/content")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-card",
                  "bg-bg-2 border border-border hover:border-amber-500/30",
                  "transition-all"
                )}
              >
                <div className="flex items-center gap-3">
                  <Wrench size={20} className="text-amber-400" />
                  <div className="text-left">
                    <p className="text-body font-medium text-text-primary">Content Manager</p>
                    <p className="text-caption text-text-muted">Generate curriculum</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-muted" />
              </button>
            </div>

            {/* Privacy & Security */}
            <div className="p-4 rounded-card bg-bg-2 border border-border">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-text-muted" />
                <p className="text-caption text-text-muted">
                  Your data is encrypted and never sold to third parties
                </p>
              </div>
            </div>

            {/* Web Testing Toggle (only on web) */}
            {!isNative && (
              <button
                onClick={toggleProForTesting}
                className="w-full p-3 rounded-card bg-amber-500/10 border border-amber-500/20 text-center"
              >
                <p className="text-caption text-amber-400">
                  🧪 Web Testing: Tap to toggle Pro status ({isProUser ? "ON" : "OFF"})
                </p>
              </button>
            )}

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className={cn(
                "w-full flex items-center justify-center gap-2 p-4 rounded-card",
                "bg-red-500/10 border border-red-500/20 text-red-400",
                "hover:bg-red-500/20 transition-all"
              )}
            >
              <LogOut size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          </motion.div>
        );
    }
  };

  return (
    <AppLayout>
      {/* Remove duplicate padding - AppLayout handles safe-bottom */}
      <div className="min-h-screen screen-padding pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => activeSection === "main" ? navigate(-1) : setActiveSection("main")}
            className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center hover:border-accent/30 transition-colors"
          >
            <ArrowLeft size={20} className="text-text-primary" />
          </button>
          <h1 className="text-h2 text-text-primary">Settings</h1>
        </div>

        {renderContent()}
      </div>
    </AppLayout>
  );
}