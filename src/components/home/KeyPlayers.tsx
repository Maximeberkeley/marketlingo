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
  const companies = marketCompanies[marketId] || defaultCompanies;

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
          <button className="flex items-center gap-1 text-caption text-text-muted hover:text-accent transition-colors">
            <span>See all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Company Cards - Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {companies.map((company, index) => (
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
              
              {/* Market Cap Preview */}
              {company.marketCap && (
                <p className="text-[11px] text-text-muted mt-2 text-left truncate">
                  {company.marketCap}
                </p>
              )}

              {/* Hover Accent */}
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-accent to-accent/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Company Detail Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="bg-bg-1 border-border max-w-md max-h-[85vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedCompany && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DialogHeader>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-bg-2 border border-border flex items-center justify-center">
                      <span className="text-4xl">{selectedCompany.logo}</span>
                    </div>
                    <div>
                      <DialogTitle className="text-h2 text-text-primary">
                        {selectedCompany.name}
                      </DialogTitle>
                      {selectedCompany.ticker && (
                        <span className="chip-accent text-[11px] mt-1">
                          ${selectedCompany.ticker}
                        </span>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <p className="text-body text-text-secondary mb-5 leading-relaxed">
                  {selectedCompany.description}
                </p>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                    <Users size={16} className="text-accent mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">CEO</p>
                      <p className="text-body text-text-primary">{selectedCompany.ceo}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                    <Calendar size={16} className="text-accent mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Founded</p>
                      <p className="text-body text-text-primary">{selectedCompany.founded}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                    <Globe size={16} className="text-accent mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">HQ</p>
                      <p className="text-body text-text-primary text-[13px]">
                        {selectedCompany.headquarters.split(",")[0]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                    <Building2 size={16} className="text-accent mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Employees</p>
                      <p className="text-body text-text-primary">{selectedCompany.employees}</p>
                    </div>
                  </div>
                </div>

                {/* Market Cap */}
                {selectedCompany.marketCap && (
                  <div className="flex items-center gap-3 p-4 rounded-card bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 mb-5">
                    <TrendingUp size={20} className="text-accent" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Market Cap</p>
                      <p className="text-h3 text-accent">{selectedCompany.marketCap}</p>
                    </div>
                  </div>
                )}

                {/* Key Products */}
                {selectedCompany.keyProducts.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Key Products</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompany.keyProducts.map((product) => (
                        <span key={product} className="chip">
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent News */}
                {selectedCompany.recentNews && (
                  <div className="p-4 rounded-card bg-bg-2 border border-border">
                    <p className="text-[10px] uppercase tracking-wider text-accent mb-2">Latest Update</p>
                    <p className="text-body text-text-secondary leading-relaxed">
                      {selectedCompany.recentNews}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
