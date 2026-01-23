import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Cpu, Building2, Car, Pill, Zap, Smartphone, Wheat, Plane, Palette, ShoppingBag, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketCard } from "@/components/ui/MarketCard";

const markets = [
  { id: "ai", name: "AI Industry", icon: Cpu },
  { id: "fintech", name: "Fintech", icon: Building2 },
  { id: "ev", name: "Electric Vehicles", icon: Car },
  { id: "biotech", name: "Biotech", icon: Pill },
  { id: "energy", name: "Clean Energy", icon: Zap },
  { id: "mobile", name: "Mobile Tech", icon: Smartphone },
  { id: "agtech", name: "AgTech", icon: Wheat },
  { id: "aerospace", name: "Aerospace", icon: Plane },
  { id: "creator", name: "Creator Economy", icon: Palette },
  { id: "ecommerce", name: "E-commerce", icon: ShoppingBag },
  { id: "gaming", name: "Gaming", icon: Gamepad2 },
];

export default function SelectMarketPage() {
  const navigate = useNavigate();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMarkets = markets.filter((market) =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStart = () => {
    if (selectedMarket) {
      // Store selected market and navigate to home
      localStorage.setItem("selectedMarket", selectedMarket);
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-h1 text-text-primary mb-2"
        >
          Choose your market
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="caption text-text-muted"
        >
          Pick one. We'll guide you for 12 months.
        </motion.p>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-4 mb-6"
      >
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search markets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-bg-2 border border-border rounded-[16px] text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </motion.div>

      {/* Market Grid */}
      <div className="flex-1 px-4 pb-32 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
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
                selected={selectedMarket === market.id}
                onSelect={setSelectedMarket}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Fixed Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg-0 via-bg-0 to-transparent pt-8">
        <Button
          variant="cta"
          size="full"
          disabled={!selectedMarket}
          onClick={handleStart}
          className={!selectedMarket ? "opacity-50 cursor-not-allowed" : ""}
        >
          Start my 1-year journey
        </Button>
      </div>
    </div>
  );
}
