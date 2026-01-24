import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Bell, Info, LogOut, ChevronRight, Shield, Rocket, Wrench } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type SettingsSection = "main" | "notifications" | "about";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");

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
                  <p className="text-body font-medium text-text-primary">
                    {user?.email || "User"}
                  </p>
                  <p className="text-caption text-text-muted">
                    Aerospace Learner
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Options */}
            <div className="space-y-2">
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
      <div className="min-h-screen pb-28">
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