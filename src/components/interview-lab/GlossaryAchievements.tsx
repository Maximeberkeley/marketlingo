import { useState, useMemo } from "react";
import { Search, BookOpen, Award, Trophy, CheckCircle, Hash, MessageSquare, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOTAL_FRAMEWORKS } from "./FrameworksLibrary";
import { TOTAL_BEHAVIORAL_QUESTIONS } from "./BehavioralQA";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

const GLOSSARY: GlossaryTerm[] = [
  { term: 'MECE', definition: 'Mutually Exclusive, Collectively Exhaustive. A framework for organizing ideas without overlap or gaps.', category: 'Framework' },
  { term: 'TAM', definition: 'Total Addressable Market. The full revenue opportunity available for a product or service.', category: 'Market Sizing' },
  { term: 'SAM', definition: 'Serviceable Available Market. The portion of TAM you can reach with your business model.', category: 'Market Sizing' },
  { term: 'SOM', definition: 'Serviceable Obtainable Market. The realistic share of SAM you can capture.', category: 'Market Sizing' },
  { term: 'ROI', definition: 'Return on Investment. Net profit divided by cost of investment, expressed as a percentage.', category: 'Financial' },
  { term: 'CAGR', definition: 'Compound Annual Growth Rate. The smoothed annual rate of growth over a period.', category: 'Financial' },
  { term: 'NPV', definition: 'Net Present Value. The difference between present value of cash inflows and outflows.', category: 'Financial' },
  { term: 'IRR', definition: 'Internal Rate of Return. The discount rate that makes NPV equal to zero.', category: 'Financial' },
  { term: 'EBITDA', definition: 'Earnings Before Interest, Taxes, Depreciation, and Amortization. A measure of operating performance.', category: 'Financial' },
  { term: 'P&L', definition: 'Profit and Loss statement. Shows revenue, costs, and net income over a period.', category: 'Financial' },
  { term: 'SWOT', definition: 'Strengths, Weaknesses, Opportunities, Threats. A strategic analysis framework.', category: 'Framework' },
  { term: 'BCG Matrix', definition: 'Portfolio analysis tool classifying products by market growth and market share into Stars, Cash Cows, Question Marks, and Dogs.', category: 'Framework' },
  { term: "Porter's Five Forces", definition: 'Framework analyzing five competitive forces: rivalry, new entrants, substitutes, buyer power, supplier power.', category: 'Framework' },
  { term: 'Value Chain', definition: 'The full range of activities a company performs to create a product from design to delivery.', category: 'Framework' },
  { term: 'Market Entry', definition: 'Strategy for entering a new market. Consider organic growth, M&A, or partnerships.', category: 'Strategy' },
  { term: 'Due Diligence', definition: 'Comprehensive investigation of a business before a merger, acquisition, or investment.', category: 'Strategy' },
  { term: 'Synergies', definition: 'Combined value and performance of two companies exceeding the sum of their individual parts.', category: 'Strategy' },
  { term: 'Unit Economics', definition: 'Revenue and cost analysis per unit. Key: Customer Acquisition Cost vs Lifetime Value.', category: 'Financial' },
  { term: 'CAC', definition: 'Customer Acquisition Cost. Total cost of acquiring a new customer.', category: 'Financial' },
  { term: 'LTV', definition: 'Lifetime Value. Total revenue expected from a single customer over their lifetime.', category: 'Financial' },
  { term: 'Breakeven', definition: 'The point where total revenue equals total costs. No profit, no loss.', category: 'Financial' },
  { term: 'Churn Rate', definition: 'Percentage of customers who stop using a product in a given period.', category: 'Metrics' },
  { term: 'Retention Rate', definition: 'Percentage of customers who continue using a product. Retention = 1 - Churn.', category: 'Metrics' },
  { term: 'Gross Margin', definition: 'Revenue minus COGS divided by revenue. Shows production profitability.', category: 'Financial' },
  { term: 'Pivot', definition: 'A fundamental change in business strategy or product direction based on market feedback.', category: 'Strategy' },
];

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  current: number;
  target: number;
}

export function GlossaryAchievements({ mathDrillsCompleted, notesSaved, frameworksRead }: {
  mathDrillsCompleted: number;
  notesSaved: number;
  frameworksRead: number;
}) {
  const [tab, setTab] = useState<'glossary' | 'achievements'>('glossary');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return GLOSSARY;
    const q = search.toLowerCase();
    return GLOSSARY.filter(t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [search]);

  const grouped = useMemo(() => {
    const g: Record<string, GlossaryTerm[]> = {};
    filtered.forEach(t => { if (!g[t.category]) g[t.category] = []; g[t.category].push(t); });
    return g;
  }, [filtered]);

  const frameworksPct = Math.min(100, Math.round((frameworksRead / TOTAL_FRAMEWORKS) * 100));

  const badges: AchievementBadge[] = [
    { id: 'math-10', title: 'Number Cruncher', description: 'Complete 10 math drills', icon: <Hash size={20} />, color: 'from-amber-500 to-orange-600', current: mathDrillsCompleted, target: 10 },
    { id: 'math-50', title: 'Math Wizard', description: 'Complete 50 math drills', icon: <Hash size={20} />, color: 'from-violet-500 to-purple-600', current: mathDrillsCompleted, target: 50 },
    { id: 'notes-4', title: 'Note Taker', description: 'Add 4 personal answers', icon: <MessageSquare size={20} />, color: 'from-emerald-500 to-green-600', current: notesSaved, target: 4 },
    { id: 'notes-10', title: 'Story Builder', description: 'Add 10 personal answers', icon: <MessageSquare size={20} />, color: 'from-blue-500 to-indigo-600', current: notesSaved, target: 10 },
    { id: 'frameworks-all', title: 'Framework Master', description: 'Read all business frameworks', icon: <Layers size={20} />, color: 'from-pink-500 to-rose-600', current: frameworksRead, target: TOTAL_FRAMEWORKS },
    { id: 'interview-3', title: 'Interview Ready', description: 'Complete all 3 main sections', icon: <Trophy size={20} />, color: 'from-yellow-500 to-amber-600', current: Math.min(3, (mathDrillsCompleted > 0 ? 1 : 0) + (notesSaved > 0 ? 1 : 0) + (frameworksRead > 0 ? 1 : 0)), target: 3 },
  ];

  const unlockedCount = badges.filter(b => b.current >= b.target).length;

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-2 bg-bg-1 rounded-2xl p-1">
        <button onClick={() => setTab('glossary')}
          className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
            tab === 'glossary' ? "bg-bg-2 text-text-primary shadow-sm" : "text-text-muted")}>
          <BookOpen size={16} /> Glossary
        </button>
        <button onClick={() => setTab('achievements')}
          className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
            tab === 'achievements' ? "bg-bg-2 text-text-primary shadow-sm" : "text-text-muted")}>
          <Award size={16} /> Achievements
        </button>
      </div>

      {tab === 'glossary' ? (
        <>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Glossary</h3>
              <p className="text-xs text-text-muted">{GLOSSARY.length} consulting terms</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-bg-2 border border-border">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              placeholder="Search terms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <span className="text-[10px] text-text-muted">{filtered.length} results</span>}
          </div>

          {Object.entries(grouped).map(([cat, terms]) => (
            <div key={cat}>
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">{cat}</p>
              <div className="space-y-2">
                {terms.map(t => (
                  <div key={t.term} className="bg-bg-2 rounded-2xl p-4 border border-border">
                    <p className="text-sm font-bold text-text-primary mb-1">{t.term}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{t.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10">
              <Search size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">No terms found for "{search}"</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Achievement Header */}
          <div className="bg-gradient-to-br from-blue-500 to-violet-600 rounded-3xl p-5 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Award size={32} className="text-amber-300" />
            </div>
            <p className="text-3xl font-black">{unlockedCount}<span className="text-lg text-white/70">/{badges.length}</span></p>
            <p className="text-xs text-white/70 mt-1">The more badges you earn, the better prepared you are</p>
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-2">
            <ProgressMini label="Math Drills" value={mathDrillsCompleted} icon={<Hash size={14} />} color="text-amber-500" />
            <ProgressMini label="Notes" value={notesSaved} icon={<MessageSquare size={14} />} color="text-emerald-500" />
            <ProgressMini label="Frameworks" value={`${frameworksPct}%`} icon={<Layers size={14} />} color="text-violet-500" />
          </div>

          {/* Badge Grid */}
          <div className="grid grid-cols-2 gap-3">
            {badges.map(b => {
              const unlocked = b.current >= b.target;
              const pct = Math.min(100, Math.round((b.current / b.target) * 100));
              return (
                <div key={b.id} className={cn("bg-bg-2 rounded-2xl p-4 border border-border", unlocked && "ring-2 ring-primary/30")}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-3",
                    unlocked ? `bg-gradient-to-br ${b.color} text-white` : "bg-bg-1 text-text-muted"
                  )}>
                    {b.icon}
                  </div>
                  <p className="text-sm font-bold text-text-primary mb-0.5">{b.title}</p>
                  <p className="text-[10px] text-text-muted mb-2">{b.description}</p>
                  <div className="h-1.5 rounded-full bg-bg-1 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", unlocked ? "bg-emerald-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                  </div>
                  <p className={cn("text-[10px] font-bold mt-1", unlocked ? "text-emerald-500" : "text-text-muted")}>
                    {unlocked ? '✓ Unlocked' : `${b.current}/${b.target}`}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ProgressMini({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-bg-2 rounded-2xl p-3 border border-border text-center">
      <div className={cn("flex justify-center mb-1", color)}>{icon}</div>
      <p className="text-lg font-black text-text-primary">{value}</p>
      <p className="text-[9px] text-text-muted">{label}</p>
    </div>
  );
}
