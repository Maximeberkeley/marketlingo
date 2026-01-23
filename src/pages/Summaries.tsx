import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, ChevronRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Summary {
  id: string;
  title: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  date: string;
  readTime: number;
  keyTakeaways: string[];
  content: string;
}

const mockSummaries: Summary[] = [
  {
    id: "1",
    title: "AI Chip Wars Intensify",
    type: "DAILY",
    date: "2024-01-23",
    readTime: 3,
    keyTakeaways: [
      "NVIDIA faces increasing competition from AMD and custom chips",
      "Cloud providers accelerating in-house chip development",
      "Supply constraints easing but demand still outpaces",
    ],
    content:
      "Today's market showed continued tension in the AI chip space. NVIDIA's dominance is being challenged on multiple fronts...",
  },
  {
    id: "2",
    title: "Week in AI: Foundation Model Race",
    type: "WEEKLY",
    date: "2024-01-22",
    readTime: 7,
    keyTakeaways: [
      "Anthropic Claude 3 raises the reasoning bar",
      "Open source models closing the gap",
      "Enterprise adoption accelerating despite costs",
      "Multimodal becoming table stakes",
    ],
    content:
      "This week marked a significant shift in the foundation model landscape. Anthropic's Claude 3 release demonstrated...",
  },
  {
    id: "3",
    title: "December AI Landscape",
    type: "MONTHLY",
    date: "2024-01-01",
    readTime: 12,
    keyTakeaways: [
      "Record VC investment in AI infrastructure",
      "Enterprise spend on AI tools up 150% YoY",
      "Regulatory frameworks taking shape globally",
      "Talent competition intensifying",
      "Agent frameworks emerging as next frontier",
    ],
    content:
      "December 2024 marked a pivotal month for the AI industry. Investment patterns shifted decisively toward infrastructure...",
  },
];

export default function SummariesPage() {
  const navigate = useNavigate();
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);

  const filterByType = (type: Summary["type"]) => mockSummaries.filter((s) => s.type === type);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (selectedSummary) {
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
            <span className="chip-accent text-xs">{selectedSummary.type}</span>
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
              {formatDate(selectedSummary.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {selectedSummary.readTime} min read
            </span>
          </div>

          {/* Key Takeaways */}
          <div className="card-elevated mb-6">
            <h3 className="text-h3 text-text-primary mb-3">Key Takeaways</h3>
            <ul className="space-y-2">
              {selectedSummary.keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-caption flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-body text-text-secondary">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-body text-text-secondary leading-relaxed">
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
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="w-full bg-bg-1 p-1 rounded-button mb-6">
            <TabsTrigger value="daily" className="flex-1 rounded-button data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 rounded-button data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 rounded-button data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Monthly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3">
            {filterByType("DAILY").map((summary, index) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                index={index}
                onClick={() => setSelectedSummary(summary)}
              />
            ))}
            {filterByType("DAILY").length === 0 && <EmptyState type="daily" />}
          </TabsContent>

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
            <span>{formatDate(summary.date)}</span>
            <span>•</span>
            <span>{summary.readTime} min</span>
            <span>•</span>
            <span>{summary.keyTakeaways.length} takeaways</span>
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
