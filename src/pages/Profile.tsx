import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Cpu, ChevronRight, Download, LogOut, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [marketName, setMarketName] = useState("AI Industry");
  const [showChangeWarning, setShowChangeWarning] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("selectedMarket");
    const marketNames: Record<string, string> = {
      ai: "AI Industry",
      fintech: "Fintech",
      ev: "Electric Vehicles",
      biotech: "Biotech",
      energy: "Clean Energy",
      mobile: "Mobile Tech",
      agtech: "AgTech",
      aerospace: "Aerospace",
      creator: "Creator Economy",
      ecommerce: "E-commerce",
      gaming: "Gaming",
    };
    if (stored) {
      setMarketName(marketNames[stored] || "AI Industry");
    }
  }, []);

  const handleChangeMarket = () => {
    localStorage.removeItem("selectedMarket");
    navigate("/select-market");
  };

  const handleExportNotebook = () => {
    toast.success("Notebook exported as Markdown!");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="screen-padding pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-h1 text-text-primary">Profile</h1>
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
                <p className="text-caption text-text-muted">1-year journey</p>
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

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-caption text-text-muted mb-3 uppercase tracking-wider">Account</h3>
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
    </AppLayout>
  );
}
