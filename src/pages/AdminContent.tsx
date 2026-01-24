import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RefreshCw, 
  Calendar,
  BookOpen,
  Gamepad2,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
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
}

interface CurriculumPlan {
  daysToGenerate: number[];
  existingDays: number[];
  plan: { day: number; month: number; week: number; type: string; theme: string }[];
  message: string;
}

const MONTHS = [
  { month: 1, theme: "Foundations", color: "bg-blue-500" },
  { month: 2, theme: "Commercial Aviation", color: "bg-emerald-500" },
  { month: 3, theme: "Defense & Government", color: "bg-red-500" },
  { month: 4, theme: "Space Economy", color: "bg-purple-500" },
  { month: 5, theme: "Emerging Technologies", color: "bg-amber-500" },
  { month: 6, theme: "Business & Strategy", color: "bg-pink-500" },
];

export default function AdminContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CurriculumPlan | null>(null);
  const [results, setResults] = useState<GenerationResult | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const fetchPlan = async (month?: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { month, dryRun: true }
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

  const generateContent = async (month?: number) => {
    setLoading(true);
    setProgress(0);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { month }
      });

      if (error) throw error;
      
      setResults(data);
      setProgress(100);
      
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

  const getMonthStats = (monthNum: number) => {
    if (!plan) return { existing: 0, toGenerate: 0, total: 30 };
    
    const startDay = (monthNum - 1) * 30 + 1;
    const endDay = monthNum * 30;
    
    const existing = plan.existingDays.filter(d => d >= startDay && d <= endDay).length;
    const toGenerate = plan.daysToGenerate.filter(d => d >= startDay && d <= endDay).length;
    
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
            <p className="text-caption text-text-muted">Generate curriculum for 180-day program</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-card bg-bg-2 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 text-text-primary">6-Month Curriculum</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPlan()}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={16} />}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          {plan && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-caption">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-text-secondary">Existing: {plan.existingDays.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-text-secondary">To Generate: {plan.daysToGenerate.length}</span>
                </div>
              </div>
              <Progress value={(plan.existingDays.length / 180) * 100} className="h-2" />
              <p className="text-caption text-text-muted">
                {plan.existingDays.length}/180 days complete
              </p>
            </div>
          )}

          {!plan && !loading && (
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
                  fetchPlan(m.month);
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
                  Month {selectedMonth}: {MONTHS[selectedMonth - 1].theme}
                </h3>
                <p className="text-caption text-text-muted">
                  {plan.daysToGenerate.length} days to generate
                </p>
              </div>
              <Button
                onClick={() => generateContent(selectedMonth)}
                disabled={loading || plan.daysToGenerate.length === 0}
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

            {/* Day types breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { type: "DAILY_GAME", icon: Gamepad2, label: "Games" },
                { type: "MICRO_LESSON", icon: BookOpen, label: "Lessons" },
                { type: "TRAINER", icon: Target, label: "Trainer" },
                { type: "BOOK_SNAPSHOT", icon: Clock, label: "History" },
              ].map(({ type, icon: Icon, label }) => (
                <div key={type} className="p-2 rounded-lg bg-bg-1 text-center">
                  <Icon size={16} className="text-accent mx-auto mb-1" />
                  <p className="text-[10px] text-text-muted">{label}</p>
                  <p className="text-caption text-text-primary">
                    {plan.plan.filter(p => p.type === type).length}
                  </p>
                </div>
              ))}
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-caption text-accent">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating content...</span>
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
            
            <div className="space-y-3">
              {results.generated.length > 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-body text-text-primary">
                      {results.generated.length} days generated
                    </p>
                    <p className="text-caption text-text-muted">
                      Days: {results.generated.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {results.skipped.length > 0 && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-body text-text-primary">
                      {results.skipped.length} days skipped (already exist)
                    </p>
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
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
        <div className="pt-4">
          <Button
            onClick={() => generateContent()}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Generate All Missing Content
          </Button>
          <p className="text-center text-caption text-text-muted mt-2">
            This may take a while for large batches
          </p>
        </div>
      </div>
    </div>
  );
}
