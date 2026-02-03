import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Bell, Info, LogOut, ChevronRight, Shield, Rocket, Wrench, Crown, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

type SettingsSection = "main" | "notifications" | "about";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isProUser, toggleProForTesting, isNative } = useSubscription();
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (activeSection === "notifications") {
    return (
      <AppLayout>
        <div className="px-5 pt-safe pb-28 w-full">
          <div className="flex items-center gap-3 py-4 mb-4">
            <button
              onClick={() => setActiveSection("main")}
              className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
            <h1 className="text-lg font-bold text-text-primary">Notifications</h1>
          </div>
          <NotificationSettings />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "about") {
    return (
      <AppLayout>
        <div className="px-5 pt-safe pb-28 w-full">
          <div className="flex items-center gap-3 py-4 mb-4">
            <button
              onClick={() => setActiveSection("main")}
              className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
            <h1 className="text-lg font-bold text-text-primary">About</h1>
          </div>
          
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Rocket size={32} className="text-accent" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-1">MarketLingo</h2>
            <p className="text-sm text-text-muted mb-8">Learn industries in 6 months</p>
            
            <div className="space-y-3 text-left">
              <div className="p-4 rounded-2xl bg-bg-2 border border-border">
                <p className="text-xs text-text-muted mb-1">Duration</p>
                <p className="text-sm font-medium text-text-primary">180 days</p>
              </div>
              <div className="p-4 rounded-2xl bg-bg-2 border border-border">
                <p className="text-xs text-text-muted mb-1">Version</p>
                <p className="text-sm font-medium text-text-primary">1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-5 pt-safe pb-28 w-full">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-text-primary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Settings</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-bg-2 border border-border mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <User size={24} className="text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary">
                  {user?.email || "User"}
                </p>
                {isProUser && (
                  <span className="px-1.5 py-0.5 rounded bg-accent text-white text-[10px] font-medium">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {isProUser ? "Pro Member" : "Free Plan"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscription */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate("/subscription")}
          className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 mb-6 active:scale-[0.98] transition-transform"
        >
          {isProUser ? (
            <Sparkles size={20} className="text-accent" />
          ) : (
            <Crown size={20} className="text-amber-400" />
          )}
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-text-primary">
              {isProUser ? "Manage Subscription" : "Upgrade to Pro"}
            </p>
            <p className="text-xs text-text-muted">
              {isProUser ? "View plan & billing" : "Unlock all features"}
            </p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </motion.button>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2 mb-6"
        >
          <button
            onClick={() => setActiveSection("notifications")}
            className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <Bell size={20} className="text-text-secondary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text-primary">Notifications</p>
              <p className="text-xs text-text-muted">Reminders & alerts</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button
            onClick={() => navigate("/select-market")}
            className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <Rocket size={20} className="text-text-secondary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text-primary">Change Industry</p>
              <p className="text-xs text-text-muted">Switch market focus</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button
            onClick={() => setActiveSection("about")}
            className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <Info size={20} className="text-text-secondary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text-primary">About</p>
              <p className="text-xs text-text-muted">Version & info</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button
            onClick={() => navigate("/admin/content")}
            className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <Wrench size={20} className="text-amber-400" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text-primary">Content Manager</p>
              <p className="text-xs text-text-muted">Admin tools</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>
        </motion.div>

        {/* Privacy Note */}
        <div className="p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-3 mb-6">
          <Shield size={16} className="text-text-muted flex-shrink-0" />
          <p className="text-xs text-text-muted">Your data is encrypted and never sold</p>
        </div>

        {/* Web Testing Toggle */}
        {!isNative && (
          <button
            onClick={toggleProForTesting}
            className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center mb-6"
          >
            <p className="text-xs text-amber-400">
              🧪 Toggle Pro ({isProUser ? "ON" : "OFF"})
            </p>
          </button>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-red-400 active:scale-[0.98] transition-transform"
        >
          <LogOut size={18} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </AppLayout>
  );
}
