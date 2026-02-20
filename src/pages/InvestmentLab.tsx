import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  PieChart,
  Award,
  Star,
  ChevronRight,
  Loader2,
  Sparkles,
  BookOpen,
  Eye,
  Target,
  Crown
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useInvestmentLab, CERTIFICATION_THRESHOLDS } from "@/hooks/useInvestmentLab";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getMarketName, getMarketEmoji } from "@/data/markets";
import { cn } from "@/lib/utils";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { mentors, Mentor } from "@/data/mentors";

interface InvestmentModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  scenarioType: "valuation" | "due_diligence" | "risk" | "portfolio" | "thesis";
  scoreKey: "valuation_score" | "due_diligence_score" | "risk_assessment_score" | "portfolio_construction_score";
}

const INVESTMENT_MODULES: InvestmentModule[] = [
  {
    id: "valuation",
    title: "Valuation Mastery",
    description: "Learn DCF, comparables, and industry-specific valuation methods",
    icon: BarChart3,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    scenarioType: "valuation",
    scoreKey: "valuation_score",
  },
  {
    id: "due_diligence",
    title: "Due Diligence",
    description: "Systematic approach to evaluating investment opportunities",
    icon: Eye,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    scenarioType: "due_diligence",
    scoreKey: "due_diligence_score",
  },
  {
    id: "risk_assessment",
    title: "Risk Assessment",
    description: "Identify and quantify investment risks systematically",
    icon: Shield,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    scenarioType: "risk",
    scoreKey: "risk_assessment_score",
  },
  {
    id: "portfolio",
    title: "Portfolio Construction",
    description: "Build balanced portfolios with proper allocation strategies",
    icon: PieChart,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    scenarioType: "portfolio",
    scoreKey: "portfolio_construction_score",
  },
];

export default function InvestmentLab() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isProUser, isLoading: subscriptionLoading } = useSubscription();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const kaiMentor = mentors.find(m => m.id === "kai")!;

  useEffect(() => {
    if (!authLoading && !user) {
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
      }
      setLoading(false);
    };

    fetchMarket();
  }, [user, authLoading, navigate]);

  const {
    progress,
    scenarios,
    completedScenarioIds,
    loading: labLoading,
    isUnlocked,
    getOverallProgress,
  } = useInvestmentLab(selectedMarket || undefined);

  if (loading || authLoading || labLoading || subscriptionLoading) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  // Pro gate - show upgrade prompt if not Pro user
  if (!isProUser) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen bg-bg-0">
          {/* Header */}
          <div className="bg-bg-1 border-b border-border px-4 py-4 pt-safe">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-text-primary" />
              </button>
              <div>
                <h1 className="text-h2 text-text-primary">Investment Lab</h1>
                <p className="text-caption text-text-muted">Pro Feature</p>
              </div>
            </div>
          </div>

          {/* Pro Upgrade Prompt */}
          <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-600/20 border border-accent/30 flex items-center justify-center mb-6"
            >
              <Crown size={32} className="text-accent" />
            </motion.div>
            
            <h2 className="text-h2 text-text-primary text-center mb-2">
              Pro Feature
            </h2>
            <p className="text-body text-text-secondary text-center max-w-xs mb-6">
              Investment Lab is available exclusively for Pro members. Get expert-level scenarios and earn your Investment Certification.
            </p>

            <div className="w-full max-w-xs space-y-3 mb-6">
              {[
                "20+ expert-level investment scenarios",
                "Valuation, Due Diligence, Risk & Portfolio modules",
                "Earn Investment Certification",
                "Track companies in your Watchlist"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/subscription")}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent via-purple-600 to-pink-500 text-white font-semibold flex items-center gap-2"
            >
              <Crown size={18} />
              Upgrade to Pro
            </button>

            <button
              onClick={() => navigate("/home")}
              className="mt-4 text-text-muted text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const overallProgress = getOverallProgress();
  const isCertified = progress?.investment_certified || false;

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-bg-0 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-b from-emerald-900/30 to-bg-0 border-b border-border px-4 py-4 pt-safe">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-bg-2/50 border border-border/50 flex items-center justify-center backdrop-blur-sm"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                <h1 className="text-h2 text-text-primary">Investment Lab</h1>
              </div>
              <p className="text-caption text-text-muted">
                {getMarketEmoji(selectedMarket || "aerospace")} {getMarketName(selectedMarket || "aerospace")} Focus
              </p>
            </div>
            {/* Kai — Investment mentor */}
            <MentorAvatar
              mentor={kaiMentor}
              size="sm"
              showPulse
              onClick={() => setActiveMentor(kaiMentor)}
            />
            {isCertified && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Award size={14} className="text-amber-400" />
                <span className="text-[10px] font-medium text-amber-400">CERTIFIED</span>
              </div>
            )}
          </div>

          {/* Investment XP Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-bg-2/50 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Sparkles size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-caption text-text-muted">Investment XP</p>
                <p className="text-h3 text-text-primary">{progress?.investment_xp || 0}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-caption text-text-muted">Mastery</p>
              <p className="text-h3 text-emerald-400">{overallProgress}%</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Optional Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-accent/5 border border-accent/20"
          >
            <Star size={16} className="text-accent" />
            <p className="text-caption text-text-secondary">
              <span className="font-medium text-accent">Bonus Content</span> — Optional advanced track for investment-ready knowledge
            </p>
          </motion.div>

          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-bg-2 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-body font-medium text-text-primary">Certification Progress</h3>
              <span className="text-caption text-emerald-400">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 mb-3" />
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <Target size={12} />
              <span>Complete all modules with 80%+ to earn Investment Certification</span>
            </div>
          </motion.div>

          {/* Investment Modules */}
          <div className="space-y-3">
            <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted">
              Investment Modules
            </h2>

            {INVESTMENT_MODULES.map((module, index) => {
              const score = progress?.[module.scoreKey] || 0;
              const scenarioCount = scenarios.filter(s => s.scenario_type === module.scenarioType).length;
              const completedCount = scenarios
                .filter(s => s.scenario_type === module.scenarioType)
                .filter(s => completedScenarioIds.includes(s.id)).length;

              return (
                <motion.button
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => navigate(`/investment-lab/${module.id}`)}
                  className="w-full p-4 rounded-xl bg-bg-2 border border-border text-left hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", module.bgColor)}>
                      <module.icon size={22} className={module.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-body font-medium text-text-primary">{module.title}</h3>
                        <ChevronRight size={18} className="text-text-muted" />
                      </div>
                      <p className="text-caption text-text-muted mb-2 line-clamp-1">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-bg-1 overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", module.bgColor.replace('/10', '/50'))}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-text-muted">{score}%</span>
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {completedCount}/{scenarioCount} scenarios
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Watchlist Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted">
                Your Watchlist
              </h2>
              <button
                onClick={() => navigate("/investment-lab/watchlist")}
                className="text-caption text-accent"
              >
                Manage →
              </button>
            </div>
            
            <div className="p-4 rounded-xl bg-bg-2 border border-border">
              {progress?.watchlist_companies && progress.watchlist_companies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {progress.watchlist_companies.slice(0, 5).map((company) => (
                    <div
                      key={company.id}
                      className="px-3 py-1.5 rounded-lg bg-bg-1 border border-border text-caption text-text-primary"
                    >
                      {company.ticker || company.name}
                    </div>
                  ))}
                  {progress.watchlist_companies.length > 5 && (
                    <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-caption text-accent">
                      +{progress.watchlist_companies.length - 5} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen size={24} className="text-text-muted mx-auto mb-2" />
                  <p className="text-caption text-text-muted">
                    Add companies from Key Players to track
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Investment Certificate Preview */}
          {isCertified && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => navigate("/investment-lab/certificate")}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
            >
              <div className="flex items-center gap-3">
                <Award size={28} className="text-amber-400" />
                <div className="text-left">
                  <h3 className="text-body font-medium text-amber-300">Investment Certification Earned</h3>
                  <p className="text-caption text-amber-400/70">
                    View and share your achievement
                  </p>
                </div>
                <ChevronRight size={18} className="text-amber-400 ml-auto" />
              </div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Kai — Investment mentor chat */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={`Investment Lab — ${getMarketName(selectedMarket || "aerospace")} market. Modules: Valuation, Due Diligence, Risk, Portfolio. Overall progress: ${getOverallProgress()}%.`}
        marketId={selectedMarket || undefined}
      />
    </AppLayout>
  );
}