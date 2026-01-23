import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketCard } from "@/components/ui/MarketCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const markets = [
  { id: "aerospace", name: "Aerospace", icon: "rocket" },
];

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
    market.name.toLowerCase().includes(searchQuery.toLowerCase())
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

      navigate("/home");
    } catch (error) {
      console.error("Error saving market selection:", error);
      toast.error("Failed to save selection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-bg-0 to-bg-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="screen-padding pt-12 pb-6"
      >
        <h1 className="text-h1 text-text-primary mb-2">Choose your market</h1>
        <p className="text-body text-text-secondary">
          Pick one. We'll guide you for 12 months.
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
            placeholder="Search markets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-bg-1 border-border rounded-[16px] h-12 text-text-primary placeholder:text-text-muted"
          />
        </div>
      </motion.div>

      {/* Grid */}
      <div className="flex-1 screen-padding overflow-auto pb-32">
        <div className="grid grid-cols-2 gap-3">
          {filteredMarkets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.03 }}
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
        <Button
          size="full"
          disabled={!selectedMarket || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? "Starting..." : "Start my 1-year journey"}
        </Button>
      </motion.div>
    </div>
  );
}
