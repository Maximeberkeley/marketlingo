import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Play, 
  RefreshCw, 
  Calendar,
  BookOpen,
  Gamepad2,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GenerationResult {
  generated: number[];
  skipped: number[];
  errors: { day: number; error: string }[];
  summary?: string;
}

interface CurriculumPlan {
  market: string;
  daysToGenerate: number[];
  existingDays: number[];
  missingDays?: number;
  plan: { day: number; month: number; week: number; type: string; theme: string; topic?: string }[];
  message: string;
}

interface MarketStatus {
  market_id: string;
  total_lessons: number;
  max_day: number;
}

const MARKETS = [
  { id: "aerospace", name: "Aerospace", icon: "✈️" },
  { id: "neuroscience", name: "Neuroscience", icon: "🧠" },
  { id: "ai", name: "AI", icon: "🤖" },
  { id: "fintech", name: "Fintech", icon: "💳" },
  { id: "biotech", name: "Biotech", icon: "🧬" },
  { id: "ev", name: "EV", icon: "🔋" },
  { id: "cybersecurity", name: "Cybersecurity", icon: "🔒" },
  { id: "cleanenergy", name: "Clean Energy", icon: "☀️" },
  { id: "spacetech", name: "Space Tech", icon: "🚀" },
  { id: "healthtech", name: "HealthTech", icon: "🏥" },
  { id: "robotics", name: "Robotics", icon: "🦾" },
  { id: "agtech", name: "AgTech", icon: "🌾" },
  { id: "climatetech", name: "ClimateTech", icon: "🌍" },
  { id: "logistics", name: "Logistics", icon: "📦" },
  { id: "web3", name: "Web3", icon: "⛓️" },
];

const MONTHS = [
  { month: 1, theme: "Foundations", color: "bg-blue-500" },
  { month: 2, theme: "Month 2", color: "bg-emerald-500" },
  { month: 3, theme: "Month 3", color: "bg-red-500" },
  { month: 4, theme: "Month 4", color: "bg-purple-500" },
  { month: 5, theme: "Month 5", color: "bg-amber-500" },
  { month: 6, theme: "Month 6", color: "bg-pink-500" },
];

export default function AdminContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CurriculumPlan | null>(null);
  const [results, setResults] = useState<GenerationResult | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>("aerospace");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [marketStatuses, setMarketStatuses] = useState<MarketStatus[]>([]);
  const [progress, setProgress] = useState(0);

  // Load market statuses on mount
  useEffect(() => {
    loadMarketStatuses();
  }, []);

  const loadMarketStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('stacks')
        .select('market_id, tags')
        .contains('tags', ['MICRO_LESSON']);

      if (error) throw error;

      const statusMap = new Map<string, { count: number; maxDay: number }>();
      
      data?.forEach(stack => {
        const marketId = stack.market_id;
        const tags = stack.tags as string[];
        const dayTag = tags?.find(t => t.startsWith('day-'));
        const day = dayTag ? parseInt(dayTag.replace('day-', '')) : 0;
        
        if (!statusMap.has(marketId)) {
          statusMap.set(marketId, { count: 0, maxDay: 0 });
        }
        const status = statusMap.get(marketId)!;
        status.count++;
        status.maxDay = Math.max(status.maxDay, day);
      });

      setMarketStatuses(
        Array.from(statusMap.entries()).map(([market_id, { count, maxDay }]) => ({
          market_id,
          total_lessons: count,
          max_day: maxDay,
        }))
      );
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const getMarketStatus = (marketId: string) => {
    const status = marketStatuses.find(s => s.market_id === marketId);
    return status || { total_lessons: 0, max_day: 0 };
  };

  const fetchPlan = async (marketId: string, month?: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { marketId, month, dryRun: true }
      });

      if (error) throw error;
      setPlan(data);
      setResults(null);
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to fetch curriculum plan');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (marketId: string, month?: number) => {
    setLoading(true);
    setProgress(0);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { marketId, month, batchSize: 3 }
      });

      if (error) throw error;
      
      setResults(data);
      setProgress(100);
      loadMarketStatuses(); // Refresh stats
      
      if (data.generated?.length > 0) {
        toast.success(`Generated ${data.generated.length} days of content!`);
      }
      if (data.errors?.length > 0) {
        toast.error(`${data.errors.length} errors occurred`);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const generateSummaries = async (marketId: string, month: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { marketId, month, generateSummaries: true }
      });

      if (error) throw error;
      toast.success(`Generated ${data.weekly?.length || 0} weekly + 1 monthly summary!`);
    } catch (error) {
      console.error('Error generating summaries:', error);
      toast.error('Failed to generate summaries');
    } finally {
      setLoading(false);
    }
  };

  const getMonthStats = (monthNum: number) => {
    if (!plan) return { existing: 0, toGenerate: 0, total: 30 };
    
    const startDay = (monthNum - 1) * 30 + 1;
    const endDay = monthNum * 30;
    
    const existing = plan.existingDays?.filter(d => d >= startDay && d <= endDay).length || 0;
    const toGenerate = plan.daysToGenerate?.filter(d => d >= startDay && d <= endDay).length || 0;
    
    return { existing, toGenerate, total: 30 };
  };

  return (
    <div className="min-h-screen bg-bg-0 pb-8">
      {/* Header */}
      <div className="bg-bg-1 border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-text-primary" />
          </button>
          <div>
            <h1 className="text-h2 text-text-primary">Content Manager</h1>
            <p className="text-caption text-text-muted">Generate 180-day curriculum for all industries</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Market Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-card bg-bg-2 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-accent" />
            <h2 className="text-h3 text-text-primary">Select Industry</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {MARKETS.map((market) => {
              const status = getMarketStatus(market.id);
              const progress = Math.round((status.max_day / 180) * 100);
              
              return (
                <button
                  key={market.id}
                  onClick={() => {
                    setSelectedMarket(market.id);
                    setSelectedMonth(null);
                    fetchPlan(market.id);
                  }}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    selectedMarket === market.id
                      ? "bg-accent/10 border-accent"
                      : "bg-bg-1 border-border hover:border-accent/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{market.icon}</span>
                    <span className="text-caption font-medium text-text-primary truncate">
                      {market.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1 flex-1" />
                    <span className="text-[10px] text-text-muted">{progress}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Overview for Selected Market */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-card bg-bg-2 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-h3 text-text-primary">
                {MARKETS.find(m => m.id === selectedMarket)?.icon}{' '}
                {MARKETS.find(m => m.id === selectedMarket)?.name}
              </h2>
              <p className="text-caption text-text-muted">6-month curriculum</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPlan(selectedMarket)}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={16} />}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          {plan && plan.market === selectedMarket && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-caption">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-text-secondary">Existing: {plan.existingDays?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-text-secondary">To Generate: {plan.missingDays || plan.daysToGenerate?.length || 0}</span>
                </div>
              </div>
              <Progress value={((plan.existingDays?.length || 0) / 180) * 100} className="h-2" />
              <p className="text-caption text-text-muted">
                {plan.existingDays?.length || 0}/180 days complete
              </p>
            </div>
          )}

          {(!plan || plan.market !== selectedMarket) && !loading && (
            <p className="text-caption text-text-muted">
              Click refresh to load curriculum status
            </p>
          )}
        </motion.div>

        {/* Month Cards */}
        <div className="grid grid-cols-2 gap-3">
          {MONTHS.map((m, index) => {
            const stats = getMonthStats(m.month);
            const isComplete = stats.existing >= stats.total;
            
            return (
              <motion.button
                key={m.month}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedMonth(m.month);
                  fetchPlan(selectedMarket, m.month);
                }}
                className={cn(
                  "p-4 rounded-card border text-left transition-all",
                  selectedMonth === m.month
                    ? "bg-accent/10 border-accent"
                    : "bg-bg-2 border-border hover:border-accent/50"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.color + "/20")}>
                    <Calendar size={16} className={m.color.replace('bg-', 'text-')} />
                  </div>
                  {isComplete && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>
                <p className="text-body font-medium text-text-primary">Month {m.month}</p>
                <p className="text-caption text-text-muted mb-2">{m.theme}</p>
                <Progress value={(stats.existing / stats.total) * 100} className="h-1" />
                <p className="text-[10px] text-text-muted mt-1">
                  {stats.existing}/{stats.total} days
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Month Actions */}
        {selectedMonth && plan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-card bg-bg-2 border border-accent/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-h3 text-text-primary">
                  Month {selectedMonth}
                </h3>
                <p className="text-caption text-text-muted">
                  {plan.daysToGenerate?.length || 0} days to generate
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSummaries(selectedMarket, selectedMonth)}
                  disabled={loading}
                >
                  <BookOpen size={14} />
                  <span className="ml-1">Summaries</span>
                </Button>
                <Button
                  onClick={() => generateContent(selectedMarket, selectedMonth)}
                  disabled={loading || (plan.daysToGenerate?.length || 0) === 0}
                  className="bg-accent text-bg-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  <span className="ml-2">Generate</span>
                </Button>
              </div>
            </div>

            {/* Day types breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { type: "DAILY_GAME", icon: Gamepad2, label: "News" },
                { type: "MICRO_LESSON", icon: BookOpen, label: "Lessons" },
                { type: "TRAINER", icon: Target, label: "Trainer" },
                { type: "BOOK_SNAPSHOT", icon: Clock, label: "History" },
              ].map(({ type, icon: Icon, label }) => (
                <div key={type} className="p-2 rounded-lg bg-bg-1 text-center">
                  <Icon size={16} className="text-accent mx-auto mb-1" />
                  <p className="text-[10px] text-text-muted">{label}</p>
                  <p className="text-caption text-text-primary">
                    {plan.plan?.filter(p => p.type === type).length || 0}
                  </p>
                </div>
              ))}
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-caption text-accent">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating content (this may take several minutes)...</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-card bg-bg-2 border border-border"
          >
            <h3 className="text-h3 text-text-primary mb-4">Generation Results</h3>
            
            {results.summary && (
              <p className="text-body text-text-secondary mb-4">{results.summary}</p>
            )}
            
            <div className="space-y-3">
              {results.generated?.length > 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-body text-text-primary">
                      {results.generated.length} days generated
                    </p>
                    <p className="text-caption text-text-muted">
                      Days: {results.generated.slice(0, 20).join(', ')}{results.generated.length > 20 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )}

              {results.skipped?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-body text-text-primary">
                      {results.skipped.length} days skipped (already exist)
                    </p>
                  </div>
                </div>
              )}

              {results.errors?.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 mt-0.5" />
                  <div>
                    <p className="text-body text-text-primary">
                      {results.errors.length} errors
                    </p>
                    <div className="text-caption text-text-muted space-y-1">
                      {results.errors.slice(0, 5).map((e, i) => (
                        <p key={i}>Day {e.day}: {e.error}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Generate All Button */}
        <div className="pt-4 space-y-3">
          <Button
            onClick={() => generateContent(selectedMarket)}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play size={16} className="mr-2" />
            )}
            Generate All Missing Days for {MARKETS.find(m => m.id === selectedMarket)?.name}
          </Button>
          <p className="text-center text-caption text-text-muted">
            Generates ~5 days per batch. May need multiple runs for full curriculum.
          </p>
        </div>
      </div>
    </div>
  );
}
