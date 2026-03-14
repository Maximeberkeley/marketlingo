import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Summary {
  id: string;
  title: string;
  summary_type: string;
  for_date: string;
  content: string;
  key_takeaways: string[];
}

export default function SummariesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!user) return;

      // Get user's selected market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      const market = profile?.selected_market || "aerospace";

      // Fetch summaries for this market
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("market_id", market)
        .order("for_date", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching summaries:", error);
      } else {
        const formattedSummaries = (data || []).map((s) => ({
          ...s,
          key_takeaways: Array.isArray(s.key_takeaways) 
            ? s.key_takeaways as string[]
            : [],
        }));
        setSummaries(formattedSummaries);
      }
      setLoading(false);
    };

    fetchSummaries();
  }, [user]);

  const filterByType = (type: Summary["summary_type"]) => 
    summaries.filter((s) => s.summary_type === type);

  const getReadTime = (content: string) => Math.max(2, Math.ceil(content.length / 1000));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedSummary) {
    const readTime = getReadTime(selectedSummary.content);
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-4 pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => setSelectedSummary(null)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <div className="flex-1">
            <span className="chip-accent text-xs">{selectedSummary.summary_type}</span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 screen-padding py-6 overflow-auto"
        >
          <h1 className="text-h1 text-text-primary mb-2">{selectedSummary.title}</h1>

          <div className="flex items-center gap-4 mb-6 text-caption text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(selectedSummary.for_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {readTime} min read
            </span>
          </div>

          {/* Key Takeaways */}
          {selectedSummary.key_takeaways.length > 0 && (
            <div className="card-elevated mb-6">
              <h3 className="text-h3 text-text-primary mb-3">Key Takeaways</h3>
              <ul className="space-y-2">
                {selectedSummary.key_takeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-caption flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-body text-text-secondary">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">
              {selectedSummary.content}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="screen-padding pt-4 pb-4 flex items-center gap-4 border-b border-border"
      >
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-text-secondary" />
        </button>
        <h1 className="text-h2 text-text-primary">Summaries</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex-1 screen-padding py-6">
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="w-full bg-bg-1 p-1 rounded-button mb-6">
            <TabsTrigger value="weekly" className="flex-1 rounded-button data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 rounded-button data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Monthly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-3">
            {filterByType("WEEKLY").map((summary, index) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                index={index}
                onClick={() => setSelectedSummary(summary)}
              />
            ))}
            {filterByType("WEEKLY").length === 0 && <EmptyState type="weekly" />}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-3">
            {filterByType("MONTHLY").map((summary, index) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                index={index}
                onClick={() => setSelectedSummary(summary)}
              />
            ))}
            {filterByType("MONTHLY").length === 0 && <EmptyState type="monthly" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SummaryCard({
  summary,
  index,
  onClick,
}: {
  summary: Summary;
  index: number;
  onClick: () => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const readTime = Math.max(2, Math.ceil(summary.content.length / 1000));

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="w-full card-interactive text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-h3 text-text-primary mb-1">{summary.title}</h3>
          <div className="flex items-center gap-3 text-caption text-text-muted">
            <span>{formatDate(summary.for_date)}</span>
            <span>•</span>
            <span>{readTime} min</span>
            <span>•</span>
            <span>{summary.key_takeaways.length} takeaways</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-text-muted" />
      </div>
    </motion.button>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-bg-1 flex items-center justify-center mx-auto mb-4">
        <BookOpen size={24} className="text-text-muted" />
      </div>
      <p className="text-body text-text-secondary">No {type} summaries yet</p>
      <p className="text-caption text-text-muted mt-1">Check back soon!</p>
    </div>
  );
}
