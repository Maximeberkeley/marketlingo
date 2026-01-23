import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Clock, Newspaper, Flame, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotifications, NotificationPreferences } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const timeOptions = [
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];

export function NotificationSettings() {
  const {
    isSupported,
    isRegistered,
    preferences,
    registerPushNotifications,
    updatePreferences,
  } = useNotifications();

  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    const success = await registerPushNotifications();
    setIsEnabling(false);
    
    if (success) {
      toast.success("Notifications enabled! 🔔");
    } else {
      toast.error("Could not enable notifications. Please check your device settings.");
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    await updatePreferences({ [key]: value });
    toast.success("Preferences updated");
  };

  const handleTimeChange = async (time: string) => {
    await updatePreferences({ reminderTime: time });
    toast.success(`Reminder set for ${timeOptions.find(t => t.value === time)?.label}`);
  };

  if (!isSupported) {
    return (
      <div className="p-6 rounded-card bg-bg-2 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <BellOff size={20} className="text-text-muted" />
          <h3 className="text-h3 text-text-primary">Notifications</h3>
        </div>
        <p className="text-body text-text-muted">
          Push notifications are available in the mobile app. Download the app to enable reminders!
        </p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-card bg-gradient-to-br from-accent/10 to-transparent border border-accent/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Bell size={24} className="text-accent" />
          </div>
          <div>
            <h3 className="text-h3 text-text-primary">Enable Notifications</h3>
            <p className="text-caption text-text-muted">Get daily reminders like Duolingo</p>
          </div>
        </div>
        
        <p className="text-body text-text-secondary mb-4">
          Stay on track with your aerospace learning journey. We'll remind you to complete lessons, 
          warn you when your streak is at risk, and notify you about breaking industry news.
        </p>

        <button
          onClick={handleEnableNotifications}
          disabled={isEnabling}
          className={cn(
            "w-full py-3 rounded-xl font-medium transition-all",
            "bg-accent text-bg-0 hover:bg-accent/90",
            isEnabling && "opacity-50 cursor-wait"
          )}
        >
          {isEnabling ? "Enabling..." : "Enable Notifications"}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Bell size={18} className="text-accent" />
        <h3 className="text-h3 text-text-primary">Notifications</h3>
        <span className="chip-accent text-[10px]">ON</span>
      </div>

      {/* Daily Reminder */}
      <div className="p-4 rounded-card bg-bg-2 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-accent" />
            <div>
              <p className="text-body font-medium text-text-primary">Daily Reminder</p>
              <p className="text-caption text-text-muted">Get reminded to complete lessons</p>
            </div>
          </div>
          <Switch
            checked={preferences.dailyReminder}
            onCheckedChange={(checked) => handleToggle('dailyReminder', checked)}
          />
        </div>

        {preferences.dailyReminder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-3 border-t border-border"
          >
            <p className="text-caption text-text-muted mb-2">Reminder time</p>
            <div className="flex flex-wrap gap-2">
              {timeOptions.map((time) => (
                <button
                  key={time.value}
                  onClick={() => handleTimeChange(time.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-caption transition-all",
                    preferences.reminderTime === time.value
                      ? "bg-accent text-bg-0"
                      : "bg-bg-1 text-text-secondary hover:bg-bg-1/80"
                  )}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Streak Reminders */}
      <div className="p-4 rounded-card bg-bg-2 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame size={18} className="text-orange-400" />
            <div>
              <p className="text-body font-medium text-text-primary">Streak Protection</p>
              <p className="text-caption text-text-muted">Warn when streak is at risk</p>
            </div>
          </div>
          <Switch
            checked={preferences.streakReminders}
            onCheckedChange={(checked) => handleToggle('streakReminders', checked)}
          />
        </div>
      </div>

      {/* News Alerts */}
      <div className="p-4 rounded-card bg-bg-2 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper size={18} className="text-blue-400" />
            <div>
              <p className="text-body font-medium text-text-primary">News Alerts</p>
              <p className="text-caption text-text-muted">Breaking aerospace news</p>
            </div>
          </div>
          <Switch
            checked={preferences.newsAlerts}
            onCheckedChange={(checked) => handleToggle('newsAlerts', checked)}
          />
        </div>
      </div>

      {/* Success indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <Check size={16} className="text-emerald-400" />
        <p className="text-caption text-emerald-400">Notifications are active</p>
      </div>
    </motion.div>
  );
}