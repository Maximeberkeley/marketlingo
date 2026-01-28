import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Cpu, ChevronRight, Download, LogOut, AlertTriangle, Trophy, Target, Flame, Settings, Award, Lock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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

    // Reset progress for current market
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

    toast.success("Notebook exported as Markdown!");
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
      <div className="screen-padding pt-12 safe-bottom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-h1 text-text-primary">Profile</h1>
          {user && (
            <p className="text-body text-text-secondary mt-1">{user.email}</p>
          )}
        </motion.div>

        {/* Stats Cards */}
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            <div className="card-elevated text-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <Flame size={20} className="text-primary" />
              </div>
              <p className="text-h2 text-text-primary">{progress.current_streak}</p>
              <p className="text-caption text-text-muted">Current Streak</p>
            </div>

            <div className="card-elevated text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <Trophy size={20} className="text-amber-400" />
              </div>
              <p className="text-h2 text-text-primary">{progress.longest_streak}</p>
              <p className="text-caption text-text-muted">Best Streak</p>
            </div>

            <div className="card-elevated text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <Target size={20} className="text-emerald-400" />
              </div>
              <p className="text-h2 text-text-primary">Day {progress.current_day}</p>
              <p className="text-caption text-text-muted">of 180</p>
            </div>
          </motion.div>
        )}

        {/* Certificate Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6"
        >
          <h3 className="text-caption text-text-muted mb-3 uppercase tracking-wider">Certification</h3>
          <div className="card-elevated">
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
                <p className="text-h3 text-text-primary">
                  {isEligible ? 'Certificate Unlocked!' : 'Industry Mastery Certificate'}
                </p>
                <p className="text-caption text-text-muted">
                  {isEligible 
                    ? 'Download and share your achievement' 
                    : `Complete all 180 days to unlock`}
                </p>
              </div>
            </div>
            
            {!isEligible && (
              <div className="mb-4">
                <div className="flex justify-between text-caption text-text-muted mb-1">
                  <span>Progress</span>
                  <span>{certProgress.current} / {certProgress.total} days</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            
            <Button
              variant={isEligible ? "default" : "secondary"}
              size="default"
              className="w-full gap-2"
              disabled={!isEligible}
              onClick={() => setShowCertificate(true)}
            >
              <Award size={18} />
              {isEligible ? 'View Certificate' : `${Math.round(progressPercentage)}% Complete`}
            </Button>
          </div>
        </motion.div>

        {/* Market Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="text-caption text-text-muted mb-3 uppercase tracking-wider">Current Market</h3>
          <button
            onClick={() => setShowChangeWarning(true)}
            className="w-full card-elevated flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-primary/20 flex items-center justify-center">
                <Cpu size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-h3 text-text-primary">{marketName}</p>
                <p className="text-caption text-text-muted">6-month journey</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>
        </motion.div>

        {/* Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <h3 className="text-caption text-text-muted mb-3 uppercase tracking-wider">Data</h3>
          <button
            onClick={handleExportNotebook}
            className="w-full card-elevated flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-bg-1 flex items-center justify-center">
                <Download size={20} className="text-text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-h3 text-text-primary">Export Notebook</p>
                <p className="text-caption text-text-muted">Download as Markdown</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>
        </motion.div>

        {/* Settings & Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-caption text-text-muted mb-3 uppercase tracking-wider">Account</h3>
          
          <button
            onClick={() => navigate("/settings")}
            className="w-full card-elevated flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-accent/20 flex items-center justify-center">
                <Settings size={20} className="text-accent" />
              </div>
              <div className="text-left">
                <p className="text-h3 text-text-primary">Settings</p>
                <p className="text-caption text-text-muted">Notifications & preferences</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full card-elevated flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-destructive/20 flex items-center justify-center">
                <LogOut size={20} className="text-destructive" />
              </div>
              <p className="text-h3 text-text-primary">Log out</p>
            </div>
            <ChevronRight size={18} className="text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>
        </motion.div>

        {/* App Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-caption text-text-muted mt-12"
        >
          MarketLingo v1.0.0
        </motion.p>
      </div>

      {/* Change Market Warning */}
      <Dialog open={showChangeWarning} onOpenChange={setShowChangeWarning}>
        <DialogContent className="bg-bg-2 border-border max-w-sm mx-auto">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <DialogTitle className="text-h2 text-text-primary text-center">
              Change Market?
            </DialogTitle>
            <DialogDescription className="text-body text-text-secondary text-center">
              Changing your market will reset your path and streak. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              size="default"
              className="flex-1"
              onClick={() => setShowChangeWarning(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="default"
              className="flex-1"
              onClick={handleChangeMarket}
            >
              Change Market
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Certificate Modal */}
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
