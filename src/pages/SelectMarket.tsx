import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketCard } from "@/components/ui/MarketCard";
import { LeoCharacter } from "@/components/mascot/LeoStateMachine";
import { markets } from "@/data/markets";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SelectMarketPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const filteredMarkets = markets.filter((market) =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = async () => {
    if (!selectedMarket || !user) return;

    setIsSubmitting(true);

    try {
      // Update profile with selected market
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ selected_market: selectedMarket })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      // Create initial progress
      const { error: progressError } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          market_id: selectedMarket,
          current_day: 1,
          current_streak: 0,
          longest_streak: 0,
          completed_stacks: [],
        }, {
          onConflict: "user_id,market_id"
        });

      if (progressError) {
        console.error("Progress creation error:", progressError);
      }

      // Also store in localStorage as backup
      localStorage.setItem("selectedMarket", selectedMarket);

      navigate("/select-familiarity");
    } catch (error) {
      console.error("Error saving market selection:", error);
      toast.error("Failed to save selection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMarketData = markets.find(m => m.id === selectedMarket);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-bg-0 to-bg-1">
      {/* Header with Leo - perfectly centered */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="screen-padding pt-8 pb-4 flex flex-col items-center"
      >
        {/* Leo centered above text - thinking animation for industry selection */}
        <div className="flex flex-col items-center justify-center mb-6">
          <LeoCharacter 
            size="xl" 
            animation="thinking"
          />
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-text-secondary mt-3 text-center"
          >
            Pick one, master it! 🗺️
          </motion.p>
        </div>
        
        <h1 className="text-h1 text-text-primary mb-2 text-center">Choose your industry</h1>
        <p className="text-body text-text-secondary text-center">
          Pick one. We'll guide you for 6 months.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="screen-padding pb-4"
      >
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            placeholder="Search industries…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-bg-1 border-border rounded-[16px] h-12 text-text-primary placeholder:text-text-muted"
          />
        </div>
      </motion.div>

      {/* Grid */}
      <div className="flex-1 screen-padding overflow-auto pb-40">
        <p className="text-caption text-text-muted mb-3">
          {filteredMarkets.length} industries available
        </p>
        <div className="grid grid-cols-2 gap-3">
          {filteredMarkets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.02 }}
            >
              <MarketCard
                id={market.id}
                name={market.name}
                icon={market.icon}
                isSelected={selectedMarket === market.id}
                onClick={() => setSelectedMarket(market.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 screen-padding pb-8 pt-4 bg-gradient-to-t from-bg-0 via-bg-0 to-transparent"
      >
        {selectedMarketData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-xl bg-bg-2 border border-border"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{selectedMarketData.emoji}</span>
              <span className="text-body font-medium text-text-primary">{selectedMarketData.name}</span>
            </div>
            <p className="text-caption text-text-secondary">{selectedMarketData.description}</p>
          </motion.div>
        )}
        
        <Button
          size="full"
          disabled={!selectedMarket || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? "Starting..." : "Start my 6-month journey"}
        </Button>
      </motion.div>
    </div>
  );
}
