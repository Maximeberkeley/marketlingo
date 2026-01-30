import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Trash2, 
  Building2,
  Loader2,
  Plus,
  ExternalLink
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useInvestmentLab } from "@/hooks/useInvestmentLab";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InvestmentWatchlist() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    loading: labLoading,
    isUnlocked,
    removeFromWatchlist,
  } = useInvestmentLab(selectedMarket || undefined);

  const handleRemove = async (companyId: string, companyName: string) => {
    await removeFromWatchlist(companyId);
    toast.success(`Removed ${companyName} from watchlist`);
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

  if (!isUnlocked) {
    navigate("/investment-lab");
    return null;
  }

  const watchlist = progress?.watchlist_companies || [];

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-bg-0 pb-24">
        {/* Header */}
        <div className="bg-bg-1 border-b border-border px-4 py-4 pt-safe">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/investment-lab")}
              className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
            <div>
              <h1 className="text-h2 text-text-primary">Watchlist</h1>
              <p className="text-caption text-text-muted">
                {watchlist.length} {watchlist.length === 1 ? 'company' : 'companies'} tracked
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Add Companies CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/home")}
            className="w-full p-4 rounded-xl bg-accent/10 border border-accent/30 text-left hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Plus size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-body font-medium text-accent">Add Companies</h3>
                <p className="text-caption text-text-muted">
                  Browse Key Players to add to your watchlist
                </p>
              </div>
            </div>
          </motion.button>

          {/* Watchlist */}
          {watchlist.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted">
                Tracked Companies
              </h2>
              
              <AnimatePresence mode="popLayout">
                {watchlist.map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-bg-2 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-bg-1 border border-border flex items-center justify-center">
                        <Building2 size={18} className="text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-body font-medium text-text-primary truncate">
                          {company.name}
                        </h3>
                        {company.ticker && (
                          <p className="text-caption text-text-muted">{company.ticker}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(company.id, company.name)}
                        className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-bg-2 border border-border flex items-center justify-center mb-4">
                <Building2 size={28} className="text-text-muted" />
              </div>
              <h2 className="text-h3 text-text-primary text-center mb-2">
                No Companies Yet
              </h2>
              <p className="text-body text-text-muted text-center max-w-xs mb-6">
                Add companies from Key Players section to track them here
              </p>
            </motion.div>
          )}

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-bg-2 border border-border"
          >
            <h3 className="text-caption font-medium text-text-primary mb-2">
              💡 Watchlist Tips
            </h3>
            <ul className="space-y-1 text-caption text-text-muted">
              <li>• Track companies you're interested in investing in</li>
              <li>• Add from Key Players when exploring industries</li>
              <li>• Use for building your investment thesis</li>
              <li>• Each addition earns +10 Investment XP</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
