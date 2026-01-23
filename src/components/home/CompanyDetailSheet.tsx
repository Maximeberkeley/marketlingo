import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, Users, Calendar, Globe, TrendingUp, ChevronLeft, ChevronRight, Briefcase, Target } from "lucide-react";
import { Company } from "./keyPlayersData";
import { cn } from "@/lib/utils";

interface CompanyDetailSheetProps {
  company: Company | null;
  onClose: () => void;
}

export function CompanyDetailSheet({ company, onClose }: CompanyDetailSheetProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  if (!company) return null;
  
  const totalSlides = company.slides.length + 1; // +1 for overview slide
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 50) {
      if (info.offset.x > 0 && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (info.offset.x < 0 && currentSlide < totalSlides - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    }
  };

  const segmentColors: Record<string, string> = {
    commercial: "bg-blue-500/20 text-blue-400",
    defense: "bg-red-500/20 text-red-400",
    space: "bg-purple-500/20 text-purple-400",
    propulsion: "bg-orange-500/20 text-orange-400",
    suppliers: "bg-emerald-500/20 text-emerald-400",
    services: "bg-cyan-500/20 text-cyan-400",
  };

  return (
    <Sheet open={!!company} onOpenChange={() => { setCurrentSlide(0); onClose(); }}>
      <SheetContent side="bottom" className="h-[85vh] bg-bg-1 border-border rounded-t-3xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 pb-2 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-bg-2 border border-border flex items-center justify-center">
                <span className="text-3xl">{company.logo}</span>
              </div>
              <div className="flex-1">
                <SheetTitle className="text-h2 text-text-primary text-left">
                  {company.name}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  {company.ticker && (
                    <span className="chip-accent text-[10px]">${company.ticker}</span>
                  )}
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase", segmentColors[company.segment])}>
                    {company.segment}
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Slide Progress */}
          <div className="flex gap-1 px-4 py-3">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all",
                  i === currentSlide ? "bg-accent" : "bg-border"
                )}
              />
            ))}
          </div>

          {/* Swipeable Content */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 px-4 overflow-y-auto pb-20"
              >
                {currentSlide === 0 ? (
                  /* Overview Slide */
                  <div className="space-y-4">
                    <p className="text-body text-text-secondary leading-relaxed">
                      {company.description}
                    </p>

                    {/* Industry Role */}
                    <div className="p-4 rounded-card bg-gradient-to-r from-accent/10 to-transparent border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-accent" />
                        <p className="text-caption font-medium text-accent uppercase tracking-wider">Industry Role</p>
                      </div>
                      <p className="text-body text-text-primary leading-relaxed">
                        {company.industryRole}
                      </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                        <Users size={16} className="text-accent mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">CEO</p>
                          <p className="text-body text-text-primary">{company.ceo}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                        <Calendar size={16} className="text-accent mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">Founded</p>
                          <p className="text-body text-text-primary">{company.founded}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                        <Globe size={16} className="text-accent mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">HQ</p>
                          <p className="text-body text-text-primary text-[13px]">{company.headquarters.split(",")[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-card bg-bg-2 border border-border">
                        <Building2 size={16} className="text-accent mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">Employees</p>
                          <p className="text-body text-text-primary">{company.employees}</p>
                        </div>
                      </div>
                    </div>

                    {/* Market Cap */}
                    {company.marketCap && (
                      <div className="flex items-center gap-3 p-4 rounded-card bg-bg-2 border border-border">
                        <TrendingUp size={20} className="text-accent" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">Market Cap</p>
                          <p className="text-h3 text-accent">{company.marketCap}</p>
                        </div>
                      </div>
                    )}

                    {/* Key Stats */}
                    {company.keyStats && company.keyStats.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Key Stats</p>
                        <div className="grid grid-cols-3 gap-2">
                          {company.keyStats.map((stat) => (
                            <div key={stat.label} className="p-3 rounded-card bg-bg-2 border border-border text-center">
                              <p className="text-h3 text-accent">{stat.value}</p>
                              <p className="text-[10px] text-text-muted mt-1">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Products */}
                    {company.keyProducts.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Key Products</p>
                        <div className="flex flex-wrap gap-2">
                          {company.keyProducts.map((product) => (
                            <span key={product} className="chip">{product}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Insight Slides */
                  <div className="flex flex-col h-full justify-center">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        {company.slides[currentSlide - 1].type === "competitive" ? (
                          <Target size={16} className="text-amber-400" />
                        ) : company.slides[currentSlide - 1].type === "investment" ? (
                          <TrendingUp size={16} className="text-emerald-400" />
                        ) : (
                          <Briefcase size={16} className="text-accent" />
                        )}
                        <p className={cn(
                          "text-caption uppercase tracking-wider",
                          company.slides[currentSlide - 1].type === "competitive" ? "text-amber-400" :
                          company.slides[currentSlide - 1].type === "investment" ? "text-emerald-400" : "text-accent"
                        )}>
                          {company.slides[currentSlide - 1].type === "competitive" ? "Competitive Analysis" :
                           company.slides[currentSlide - 1].type === "investment" ? "Investment Thesis" :
                           `Insight ${currentSlide} of ${company.slides.length}`}
                        </p>
                      </div>
                      
                      <h3 className="text-h2 text-text-primary">
                        {company.slides[currentSlide - 1].title}
                      </h3>
                      
                      <p className="text-body text-text-secondary leading-relaxed text-lg">
                        {company.slides[currentSlide - 1].content}
                      </p>
                      
                      {company.slides[currentSlide - 1].highlight && (
                        <div className="inline-block px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
                          <p className="text-accent font-semibold">
                            {company.slides[currentSlide - 1].highlight}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 pointer-events-none">
              <button
                onClick={() => currentSlide > 0 && setCurrentSlide(currentSlide - 1)}
                className={cn(
                  "w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center pointer-events-auto transition-opacity",
                  currentSlide === 0 ? "opacity-30" : "opacity-100"
                )}
                disabled={currentSlide === 0}
              >
                <ChevronLeft size={20} className="text-text-primary" />
              </button>
              <button
                onClick={() => currentSlide < totalSlides - 1 && setCurrentSlide(currentSlide + 1)}
                className={cn(
                  "w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center pointer-events-auto transition-opacity",
                  currentSlide === totalSlides - 1 ? "opacity-30" : "opacity-100"
                )}
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight size={20} className="text-text-primary" />
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}