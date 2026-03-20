import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";

interface Framework {
  id: string;
  name: string;
  emoji: string;
  category: string;
  overview: string;
  diagram?: 'bcg' | 'porters' | 'swot' | 'value-chain' | 'pestel';
  details: { title: string; description: string }[];
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'bcg', name: 'BCG Matrix', emoji: '📊', category: 'Portfolio',
    overview: 'The BCG Matrix is used to assess the market attractiveness of a product and to judge a given product portfolio. It divides the product portfolio based on market growth and the relative market share into 4 quadrants: Stars, Cash Cows, Question Marks, and Poor Dogs.',
    diagram: 'bcg',
    details: [
      { title: '⭐ Stars', description: 'High growth, high share. Business units or products that have the best market share and generate the most cash. Eventually, stars become cash cows.' },
      { title: '💰 Cash Cows', description: 'Low growth, high share. Products that generate more cash than needed to maintain them. They require little investment and produce excess cash flow.' },
      { title: '❓ Question Marks', description: 'High growth, low share. These products grow rapidly and consume large cash amounts, but have low market share. They may become stars or dogs.' },
      { title: '🐕 Poor Dogs', description: 'Low growth, low share. Products with low market share in mature industries. They typically break even and should be divested or repositioned.' },
    ],
  },
  {
    id: 'porters', name: "Porter's Five Forces", emoji: '🏗️', category: 'Competitive',
    overview: "Porter's Five Forces framework analyzes the competitive intensity and attractiveness of an industry. It identifies five forces that determine the competitive intensity: rivalry among existing competitors, threat of new entrants, threat of substitutes, bargaining power of buyers, and bargaining power of suppliers.",
    diagram: 'porters',
    details: [
      { title: '⚔️ Competitive Rivalry', description: 'The intensity of competition among existing firms. More competitors = lower profitability.' },
      { title: '🚪 Threat of New Entrants', description: 'How easy is it for new competitors to enter? Consider barriers like capital, regulation, and brand loyalty.' },
      { title: '🔄 Threat of Substitutes', description: 'Can customers replace your product? More substitutes = more price pressure.' },
      { title: '🛒 Buyer Power', description: 'How much leverage do customers have? Few buyers or commoditized products = high buyer power.' },
      { title: '🏭 Supplier Power', description: 'How much leverage do suppliers have? Few suppliers or unique inputs = high supplier power.' },
    ],
  },
  {
    id: 'swot', name: 'SWOT Analysis', emoji: '🎯', category: 'Strategic',
    overview: 'SWOT Analysis is a strategic planning framework that evaluates internal Strengths and Weaknesses alongside external Opportunities and Threats to inform decision-making.',
    diagram: 'swot',
    details: [
      { title: '💪 Strengths', description: 'Internal positive attributes. What does the company do well? Unique resources, competitive advantages.' },
      { title: '⚠️ Weaknesses', description: 'Internal negative attributes. What could be improved? Resource limitations, capability gaps.' },
      { title: '🌟 Opportunities', description: 'External positive factors. Market trends, technology shifts, regulatory changes that could benefit.' },
      { title: '🔥 Threats', description: 'External negative factors. Competitor actions, market shifts, economic downturns that could harm.' },
    ],
  },
  {
    id: 'value-chain', name: 'Value Chain', emoji: '🔗', category: 'Operations',
    overview: "Porter's Value Chain analysis identifies the full range of activities a company performs from design to delivery. It separates primary activities (inbound logistics, operations, outbound logistics, marketing, service) from support activities (infrastructure, HR, technology, procurement).",
    details: [
      { title: '📦 Inbound Logistics', description: 'Receiving, storing, and distributing raw materials and inputs.' },
      { title: '⚙️ Operations', description: 'Transforming inputs into final products or services.' },
      { title: '🚛 Outbound Logistics', description: 'Distributing finished products to customers.' },
      { title: '📣 Marketing & Sales', description: 'Activities that attract buyers and persuade them to purchase.' },
      { title: '🛎️ Service', description: 'Post-sale support that maintains and enhances product value.' },
    ],
  },
  {
    id: 'pestel', name: 'PESTEL Analysis', emoji: '🌍', category: 'External',
    overview: 'PESTEL is a macro-environmental framework examining six external factors that impact business: Political, Economic, Social, Technological, Environmental, and Legal. Essential for market entry cases.',
    details: [
      { title: '🏛️ Political', description: 'Government policies, trade restrictions, political stability.' },
      { title: '📈 Economic', description: 'GDP growth, interest rates, inflation, exchange rates.' },
      { title: '👥 Social', description: 'Demographics, cultural trends, consumer attitudes.' },
      { title: '💻 Technological', description: 'Innovation, R&D activity, automation, tech infrastructure.' },
      { title: '🌱 Environmental', description: 'Climate, sustainability regulations, environmental awareness.' },
      { title: '⚖️ Legal', description: 'Employment law, consumer protection, industry-specific regulations.' },
    ],
  },
  {
    id: 'mece', name: 'MECE Principle', emoji: '🧩', category: 'Foundation',
    overview: 'Mutually Exclusive, Collectively Exhaustive (MECE) is the foundational principle of structured thinking in consulting. Every item belongs in exactly ONE category (mutually exclusive) and all items are covered (collectively exhaustive).',
    details: [
      { title: '🔒 Mutually Exclusive', description: 'No overlap between categories. Each data point belongs to exactly one bucket.' },
      { title: '🌐 Collectively Exhaustive', description: 'Nothing is left out. All possibilities are covered by the framework.' },
      { title: '✅ Example', description: 'Revenue breakdown: Domestic vs International. Or: B2B vs B2C vs B2G.' },
    ],
  },
  {
    id: 'ansoff', name: 'Ansoff Matrix', emoji: '📐', category: 'Growth',
    overview: 'The Ansoff Matrix provides a strategic framework for growth by mapping products (existing/new) against markets (existing/new) to identify four growth strategies: Market Penetration, Market Development, Product Development, and Diversification.',
    details: [
      { title: '📍 Market Penetration', description: 'Existing product, existing market. Grow share through pricing, promotion, or distribution.' },
      { title: '🌐 Market Development', description: 'Existing product, new market. Expand geographically or target new segments.' },
      { title: '🆕 Product Development', description: 'New product, existing market. Innovate or extend product lines for current customers.' },
      { title: '🚀 Diversification', description: 'New product, new market. Highest risk but potentially highest reward.' },
    ],
  },
  {
    id: '4p', name: 'Marketing 4Ps', emoji: '📦', category: 'Marketing',
    overview: 'The Marketing Mix (4Ps) framework covers Product, Price, Place, and Promotion — the four key elements a company controls to influence consumer demand.',
    details: [
      { title: '🎁 Product', description: 'What you sell. Features, quality, branding, design, packaging.' },
      { title: '💵 Price', description: 'What you charge. Pricing strategy, discounts, payment terms.' },
      { title: '📍 Place', description: 'Where you sell. Distribution channels, locations, logistics.' },
      { title: '📢 Promotion', description: 'How you communicate. Advertising, PR, sales force, digital marketing.' },
    ],
  },
];

function BCGDiagram() {
  const cells = [
    { label: 'Question Marks', icon: '❓', pos: 'top-left', color: 'from-violet-500 to-violet-600' },
    { label: 'Stars', icon: '⭐', pos: 'top-right', color: 'from-violet-600 to-purple-700' },
    { label: 'Poor Dogs', icon: '🐕', pos: 'bottom-left', color: 'from-violet-400 to-violet-500' },
    { label: 'Cash Cows', icon: '💰', pos: 'bottom-right', color: 'from-purple-600 to-violet-700' },
  ];
  return (
    <div className="my-4">
      <div className="flex">
        <div className="flex flex-col justify-between items-center pr-2 py-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          <span className="text-[9px] text-text-muted font-bold">High</span>
          <span className="text-[10px] text-text-muted font-bold">Market Growth Rate</span>
          <span className="text-[9px] text-text-muted font-bold">Low</span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-2">
            {cells.map(c => (
              <div key={c.label} className={cn("flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br text-white h-24", c.color)}>
                <span className="text-xl mb-1">{c.icon}</span>
                <span className="text-[11px] font-bold text-center">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[9px] text-text-muted font-bold">Low</span>
            <span className="text-[10px] text-text-muted font-bold">Relative Market Share</span>
            <span className="text-[9px] text-text-muted font-bold">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortersDiagram() {
  return (
    <div className="my-4 flex flex-col items-center gap-3">
      <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[11px] font-bold text-center">
        🚪 Threat of New Entrants
      </div>
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-violet-400 to-violet-500 text-white text-[10px] font-bold text-center">
          🏭 Supplier Power
        </div>
        <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white text-[11px] font-bold text-center">
          ⚔️ Rivalry
        </div>
        <div className="flex-1 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white text-[10px] font-bold text-center">
          🛒 Buyer Power
        </div>
      </div>
      <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[11px] font-bold text-center">
        🔄 Threat of Substitutes
      </div>
    </div>
  );
}

function SWOTDiagram() {
  const cells = [
    { label: 'Strengths', icon: '💪', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Weaknesses', icon: '⚠️', color: 'from-amber-500 to-amber-600' },
    { label: 'Opportunities', icon: '🌟', color: 'from-blue-500 to-blue-600' },
    { label: 'Threats', icon: '🔥', color: 'from-red-500 to-red-600' },
  ];
  return (
    <div className="my-4">
      <div className="flex justify-center gap-1 mb-2">
        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">INTERNAL</span>
        <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">EXTERNAL</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cells.map(c => (
          <div key={c.label} className={cn("flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br text-white h-20", c.color)}>
            <span className="text-lg mb-0.5">{c.icon}</span>
            <span className="text-[11px] font-bold">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FrameworksLibrary({ marketId, onFrameworkRead }: { marketId: string; onFrameworkRead?: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = FRAMEWORKS.find(f => f.id === selectedId);

  if (selected) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-sm text-text-muted">
          <ArrowLeft size={16} /> All Frameworks
        </button>

        <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-3xl p-5 text-white">
          <p className="text-2xl mb-1">{selected.emoji}</p>
          <h3 className="text-xl font-black mb-1">{selected.name}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/20 font-bold">{selected.category}</span>
        </div>

        <div className="bg-bg-2 rounded-3xl p-5 border border-border">
          <h4 className="text-sm font-bold text-text-primary mb-2">Overview</h4>
          <p className="text-sm text-text-secondary leading-relaxed">{selected.overview}</p>
        </div>

        {selected.diagram === 'bcg' && <BCGDiagram />}
        {selected.diagram === 'porters' && <PortersDiagram />}
        {selected.diagram === 'swot' && <SWOTDiagram />}

        {selected.details.map((d, i) => (
          <div key={i} className="bg-bg-2 rounded-2xl p-4 border border-border">
            <p className="text-sm font-bold text-text-primary mb-1">{d.title}</p>
            <p className="text-xs text-text-secondary leading-relaxed">{d.description}</p>
          </div>
        ))}
      </motion.div>
    );
  }

  // Grid view
  const categories = [...new Set(FRAMEWORKS.map(f => f.category))];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">Frameworks</h3>
          <p className="text-xs text-text-muted">{FRAMEWORKS.length} business models & tools</p>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">{cat}</p>
          <div className="space-y-2">
            {FRAMEWORKS.filter(f => f.category === cat).map(f => (
              <button key={f.id}
                onClick={() => { setSelectedId(f.id); onFrameworkRead?.(f.id); hapticFeedback("light"); }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-bg-2 border border-border hover:border-primary/30 transition-all text-left">
                <span className="text-2xl">{f.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">{f.name}</p>
                  <p className="text-[11px] text-text-muted line-clamp-1">{f.overview.slice(0, 80)}...</p>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const TOTAL_FRAMEWORKS = FRAMEWORKS.length;
