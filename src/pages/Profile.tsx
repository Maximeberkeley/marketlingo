import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Cpu, ChevronRight, Download, LogOut, AlertTriangle, Trophy, Target, Flame, Settings, Award, Lock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useCertificate } from "@/hooks/useCertificate";
import { CompletionCertificate } from "@/components/certificate/CompletionCertificate";
import { supabase } from "@/integrations/supabase/client";

const marketNames: Record<string, string> = {
  ai: "AI Industry",
  fintech: "Fintech",
  ev: "Electric Vehicles",
  biotech: "Biotech",
  energy: "Clean Energy",
  cleanenergy: "Clean Energy",
  mobile: "Mobile Tech",
  agtech: "AgTech",
  aerospace: "Aerospace",
  creator: "Creator Economy",
  ecommerce: "E-commerce",
  gaming: "Gaming",
  neuroscience: "Neuroscience",
  cybersecurity: "Cybersecurity",
  spacetech: "Space Tech",
  healthtech: "HealthTech",
  robotics: "Robotics",
  climatetech: "Climate Tech",
  logistics: "Logistics Tech",
  web3: "Web3 & Crypto",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showChangeWarning, setShowChangeWarning] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const { progress } = useUserProgress(selectedMarket || undefined);
  const { certificateData, isEligible, progress: certProgress } = useCertificate(selectedMarket || undefined);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }

    const fetchMarket = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      } else {
        const stored = localStorage.getItem("selectedMarket");
        if (stored) setSelectedMarket(stored);
      }
    };

    fetchMarket();
  }, [user, loading, navigate]);

  const handleChangeMarket = async () => {
    if (!user) return;

    if (selectedMarket) {
      await supabase
        .from("user_progress")
        .update({
          current_streak: 0,
          current_day: 1,
          completed_stacks: [],
        })
        .eq("user_id", user.id)
        .eq("market_id", selectedMarket);
    }

    localStorage.removeItem("selectedMarket");
    navigate("/select-market");
  };

  const handleExportNotebook = async () => {
    if (!user) return;

    const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!notes || notes.length === 0) {
      toast.error("No notes to export");
      return;
    }

    const markdown = notes
      .map((note) => `## ${note.linked_label || "Note"}\n\n${note.content}\n\n---\n`)
      .join("\n");

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marketlingo-notebook.md";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Notebook exported!");
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.clear();
    navigate("/");
  };

  const marketName = selectedMarket ? marketNames[selectedMarket] || "AI Industry" : "AI Industry";
  const progressPercentage = (certProgress.current / certProgress.total) * 100;

  return (
    <AppLayout>
      <div className="px-5 pt-safe pb-28 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 mb-4"
        >
          <h1 className="text-2xl font-bold text-text-primary">Profile</h1>
          {user && (
            <p className="text-sm text-text-secondary mt-1">{user.email}</p>
          )}
        </motion.div>

        {/* Stats Row */}
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            <div className="p-4 rounded-2xl bg-bg-2 border border-border text-center">
              <Flame size={20} className="text-amber-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-text-primary">{progress.current_streak}</p>
              <p className="text-xs text-text-muted">Streak</p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-2 border border-border text-center">
              <Trophy size={20} className="text-amber-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-text-primary">{progress.longest_streak}</p>
              <p className="text-xs text-text-muted">Best</p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-2 border border-border text-center">
              <Target size={20} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-text-primary">{progress.current_day}</p>
              <p className="text-xs text-text-muted">of 180</p>
            </div>
          </motion.div>
        )}

        {/* Certificate Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Certification</h3>
          <div className="p-4 rounded-2xl bg-bg-2 border border-border">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isEligible ? 'bg-accent/20' : 'bg-bg-1'
              }`}>
                {isEligible ? (
                  <Award size={24} className="text-accent" />
                ) : (
                  <Lock size={24} className="text-text-muted" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-text-primary">
                  {isEligible ? 'Certificate Ready!' : 'Mastery Certificate'}
                </p>
                <p className="text-xs text-text-muted">
                  {isEligible ? 'Download your achievement' : `Complete 180 days to unlock`}
                </p>
              </div>
            </div>
            
            {!isEligible && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-text-muted mb-1.5">
                  <span>Progress</span>
                  <span>{certProgress.current} / {certProgress.total} days</span>
                </div>
                <div className="h-2 bg-bg-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
            
            <Button
              variant={isEligible ? "default" : "secondary"}
              className="w-full"
              disabled={!isEligible}
              onClick={() => setShowCertificate(true)}
            >
              <Award size={16} className="mr-2" />
              {isEligible ? 'View Certificate' : `${Math.round(progressPercentage)}% Complete`}
            </Button>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2 mb-6"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Settings</h3>
          
          <button
            onClick={() => setShowChangeWarning(true)}
            className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <Cpu size={20} className="text-accent" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text-primary">{marketName}</p>
              <p className="text-xs text-text-muted">Current market</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <Settings size={20} className="text-text-secondary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text-primary">Settings</p>
              <p className="text-xs text-text-muted">Notifications & preferences</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button
            onClick={handleExportNotebook}
            className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <Download size={20} className="text-text-secondary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text-primary">Export Notebook</p>
              <p className="text-xs text-text-muted">Download as Markdown</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={handleLogout}
            className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-red-400 active:scale-[0.98] transition-transform"
          >
            <LogOut size={18} />
            <span className="font-medium">Log out</span>
          </button>
        </motion.div>

        {/* Version */}
        <p className="text-center text-xs text-text-muted mt-8">
          MarketLingo v1.0.0
        </p>
      </div>

      {/* Change Market Dialog */}
      <Dialog open={showChangeWarning} onOpenChange={setShowChangeWarning}>
        <DialogContent className="bg-bg-2 border-border mx-4">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-text-primary text-center">
              Change Market?
            </DialogTitle>
            <DialogDescription className="text-sm text-text-secondary text-center">
              This will reset your progress and streak.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowChangeWarning(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleChangeMarket}>
              Change
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && certificateData && (
          <CompletionCertificate
            data={certificateData}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
