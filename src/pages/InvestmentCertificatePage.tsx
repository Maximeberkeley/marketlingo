import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2, Linkedin, Loader2, Award } from "lucide-react";
import html2canvas from "html2canvas";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvestmentCertificate } from "@/components/certificate/InvestmentCertificate";
import { useAuth } from "@/hooks/useAuth";
import { useInvestmentLab } from "@/hooks/useInvestmentLab";
import { supabase } from "@/integrations/supabase/client";
import { getMarketName } from "@/data/markets";
import { toast } from "sonner";

export default function InvestmentCertificatePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market, username")
        .eq("id", user.id)
        .single();

      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      }
      setUserName(profile?.username || user.email?.split("@")[0] || "Investor");
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, navigate]);

  const { progress, loading: labLoading } = useInvestmentLab(selectedMarket || undefined);

  const handleExport = async () => {
    if (!certificateRef.current) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `investment-certificate-${selectedMarket}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export certificate");
    } finally {
      setExporting(false);
    }
  };

  const handleShareLinkedIn = () => {
    const marketName = getMarketName(selectedMarket || "");
    const text = encodeURIComponent(
      `🎓 I've earned my Investment Certification in ${marketName} from MarketLingo!\n\nAfter completing comprehensive training in valuation, due diligence, risk assessment, and portfolio construction, I'm now certified investment-ready for the ${marketName} sector.\n\n#InvestmentCertification #${marketName.replace(/\s+/g, "")} #MarketLingo`
    );
    window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${text}`, "_blank");
    toast.success("Opening LinkedIn...");
  };

  if (loading || authLoading || labLoading) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  if (!progress?.investment_certified) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen bg-bg-0">
          <div className="bg-bg-1 border-b border-border px-4 py-4 pt-safe">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/investment-lab")}
                className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-text-primary" />
              </button>
              <h1 className="text-h2 text-text-primary">Investment Certificate</h1>
            </div>
          </div>

          <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
              <Award size={40} className="text-amber-400/50" />
            </div>
            <h2 className="text-h2 text-text-primary text-center mb-2">Not Yet Certified</h2>
            <p className="text-body text-text-muted text-center max-w-xs mb-6">
              Complete all investment modules with 80%+ score to earn your certification
            </p>
            <button
              onClick={() => navigate("/investment-lab")}
              className="px-6 py-3 rounded-xl bg-accent text-bg-0 font-medium"
            >
              Continue Training
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const completionDate = progress.certified_at
    ? new Date(progress.certified_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-bg-0 pb-8">
        {/* Header */}
        <div className="bg-bg-1 border-b border-border px-4 py-4 pt-safe">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/investment-lab")}
              className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
            <div className="flex-1">
              <h1 className="text-h2 text-text-primary">Investment Certificate</h1>
              <p className="text-caption text-text-muted">Share your achievement</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Certificate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="overflow-hidden rounded-2xl"
          >
            <InvestmentCertificate
              ref={certificateRef}
              userName={userName}
              completionDate={completionDate}
              marketName={getMarketName(selectedMarket || "")}
              investmentXP={progress.investment_xp}
              modulesCompleted={{
                valuation: progress.valuation_score,
                dueDiligence: progress.due_diligence_score,
                riskAssessment: progress.risk_assessment_score,
                portfolio: progress.portfolio_construction_score,
              }}
            />
          </motion.div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bg-2 border border-border text-text-primary"
            >
              {exporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              <span className="font-medium">Download</span>
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0A66C2] text-white"
            >
              <Linkedin size={18} />
              <span className="font-medium">LinkedIn</span>
            </button>
          </div>

          {/* Share Text */}
          <div className="p-4 rounded-xl bg-bg-2 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Share2 size={16} className="text-text-muted" />
              <span className="text-caption font-medium text-text-secondary">Share Message</span>
            </div>
            <p className="text-caption text-text-muted leading-relaxed">
              🎓 I've earned my Investment Certification in {getMarketName(selectedMarket || "")} from MarketLingo! 
              Certified investment-ready after comprehensive training in valuation, due diligence, 
              risk assessment, and portfolio construction.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}