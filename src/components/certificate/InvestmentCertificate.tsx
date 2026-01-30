import { forwardRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, BarChart3, Shield, Eye, PieChart } from "lucide-react";

interface InvestmentCertificateProps {
  userName: string;
  completionDate: string;
  marketName: string;
  investmentXP: number;
  modulesCompleted: {
    valuation: number;
    dueDiligence: number;
    riskAssessment: number;
    portfolio: number;
  };
}

export const InvestmentCertificate = forwardRef<HTMLDivElement, InvestmentCertificateProps>(
  ({ userName, completionDate, marketName, investmentXP, modulesCompleted }, ref) => {
    return (
      <div
        ref={ref}
        className="w-full max-w-2xl mx-auto bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 rounded-2xl border-2 border-emerald-500/30"
        style={{ aspectRatio: "1.414/1" }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-teal-500/10 blur-3xl" />
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
            <p className="text-emerald-400/80 text-sm uppercase tracking-[0.3em] mb-1">Certificate of</p>
            <h1 className="text-3xl font-bold text-white tracking-wide">Investment Certification</h1>
          </div>

          {/* Award Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Award size={64} className="text-amber-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl"
              />
            </div>
          </div>

          {/* Recipient */}
          <div className="text-center mb-6">
            <p className="text-emerald-400/60 text-sm mb-1">This certifies that</p>
            <h2 className="text-2xl font-bold text-white mb-1">{userName}</h2>
            <p className="text-emerald-400/60 text-sm">
              has demonstrated investment-ready proficiency in
            </p>
            <p className="text-xl font-semibold text-emerald-400 mt-1">{marketName}</p>
          </div>

          {/* Modules Achieved */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <BarChart3 size={20} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{modulesCompleted.valuation}%</p>
              <p className="text-[10px] text-emerald-400/70">Valuation</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Eye size={20} className="text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{modulesCompleted.dueDiligence}%</p>
              <p className="text-[10px] text-blue-400/70">Due Diligence</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Shield size={20} className="text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{modulesCompleted.riskAssessment}%</p>
              <p className="text-[10px] text-amber-400/70">Risk</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <PieChart size={20} className="text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{modulesCompleted.portfolio}%</p>
              <p className="text-[10px] text-purple-400/70">Portfolio</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{investmentXP.toLocaleString()}</p>
              <p className="text-xs text-emerald-400/60">Investment XP</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between text-sm">
            <div>
              <p className="text-emerald-400/60">Issue Date</p>
              <p className="text-white">{completionDate}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400/60">Credential ID</p>
              <p className="text-white font-mono text-xs">
                INV-{marketName.substring(0, 3).toUpperCase()}-{Date.now().toString(36).toUpperCase()}
              </p>
            </div>
          </div>

          {/* MarketLingo Branding */}
          <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-center gap-2">
            <span className="text-xl">📈</span>
            <span className="text-white font-semibold">MarketLingo</span>
            <span className="text-emerald-400/60 text-sm">Investment Lab</span>
          </div>
        </div>
      </div>
    );
  }
);

InvestmentCertificate.displayName = "InvestmentCertificate";