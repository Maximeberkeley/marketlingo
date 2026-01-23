import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, ChevronRight } from "lucide-react";
import { Company, marketCompanies, defaultCompanies } from "./keyPlayersData";
import { CompanyDetailSheet } from "./CompanyDetailSheet";
import { cn } from "@/lib/utils";

interface KeyPlayersProps {
  marketId: string;
}

export function KeyPlayers({ marketId }: KeyPlayersProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showAll, setShowAll] = useState(false);
  const companies = marketCompanies[marketId] || defaultCompanies;
  
  const displayedCompanies = showAll ? companies : companies.slice(0, 8);

  const segmentColors: Record<string, string> = {
    commercial: "bg-blue-500/20 text-blue-400",
    defense: "bg-red-500/20 text-red-400",
    space: "bg-purple-500/20 text-purple-400",
    propulsion: "bg-orange-500/20 text-orange-400",
    suppliers: "bg-emerald-500/20 text-emerald-400",
    services: "bg-cyan-500/20 text-cyan-400",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Building2 size={16} className="text-accent" />
            </div>
            <h2 className="text-h3 text-text-primary">Key Players</h2>
            <span className="chip text-[10px]">{companies.length}</span>
          </div>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-caption text-text-muted hover:text-accent transition-colors"
          >
            <span>{showAll ? "Show less" : "See all"}</span>
            <ChevronRight size={14} className={cn("transition-transform", showAll && "rotate-90")} />
          </button>
        </div>

        {/* Company Cards - Horizontal Scroll or Grid */}
        {showAll ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
            {displayedCompanies.map((company, index) => (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCompany(company)}
                className={cn(
                  "group relative overflow-hidden text-left",
                  "p-3 rounded-card",
                  "bg-bg-2 border border-border",
                  "hover:border-accent/50 hover:bg-bg-2/80",
                  "transition-all duration-200"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-bg-1 border border-border flex items-center justify-center group-hover:border-accent/30 transition-colors">
                    <span className="text-xl">{company.logo}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-primary truncate">
                      {company.name}
                    </p>
                    {company.ticker && (
                      <p className="text-[11px] text-accent">${company.ticker}</p>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-medium uppercase",
                  segmentColors[company.segment]
                )}>
                  {company.segment}
                </span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {displayedCompanies.map((company, index) => (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCompany(company)}
                className={cn(
                  "flex-shrink-0 group relative overflow-hidden",
                  "w-[140px] p-4 rounded-card",
                  "bg-bg-2 border border-border",
                  "hover:border-accent/50 hover:bg-bg-2/80",
                  "transition-all duration-200"
                )}
              >
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl bg-bg-1 border border-border flex items-center justify-center mb-3 group-hover:border-accent/30 transition-colors">
                  <span className="text-2xl">{company.logo}</span>
                </div>
                
                {/* Company Name */}
                <p className="text-body font-medium text-text-primary text-left truncate">
                  {company.name}
                </p>
                
                {/* Ticker */}
                {company.ticker && (
                  <p className="text-caption text-accent mt-0.5 text-left">
                    ${company.ticker}
                  </p>
                )}
                
                {/* Segment Tag */}
                <div className="mt-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-medium uppercase",
                    segmentColors[company.segment]
                  )}>
                    {company.segment}
                  </span>
                </div>

                {/* Hover Accent */}
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-accent to-accent/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Company Detail Sheet */}
      <CompanyDetailSheet 
        company={selectedCompany} 
        onClose={() => setSelectedCompany(null)} 
      />
    </>
  );
}