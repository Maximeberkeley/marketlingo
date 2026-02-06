import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, Lightbulb, Rocket, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeoCharacter } from "@/components/mascot/LeoStateMachine";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getMarketName, getMarketEmoji } from "@/data/markets";
import { cn } from "@/lib/utils";

type FamiliarityLevel = "beginner" | "intermediate" | "advanced";

interface LevelOption {
  id: FamiliarityLevel;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  examples: string[];
}

const levelOptions: LevelOption[] = [
  {
    id: "beginner",
    icon: <Lightbulb className="w-7 h-7" />,
    title: "New to this",
    subtitle: "Beginner",
    description: "Start from fundamentals with clear definitions and context",
    examples: [
      "Learning core terminology",
      "Understanding basic concepts",
      "Building foundational knowledge"
    ]
  },
  {
    id: "intermediate",
    icon: <GraduationCap className="w-7 h-7" />,
    title: "Some experience",
    subtitle: "Intermediate",
    description: "Skip basics, focus on real-world application and examples",
    examples: [
      "Know the key players",
      "Familiar with industry terms",
      "Ready for deeper insights"
    ]
  },
  {
    id: "advanced",
    icon: <Rocket className="w-7 h-7" />,
    title: "Industry expert",
    subtitle: "Advanced",
    description: "High-density content with nuance and current events",
    examples: [
      "Years of experience",
      "Deep domain knowledge",
      "Want strategic insights"
    ]
  }
];

export default function SelectFamiliarityPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<FamiliarityLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    // Fetch the selected market to show context
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();
      
      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      } else {
        // No market selected, go back to select-market
        navigate("/select-market");
      }
    };

    fetchMarket();
  }, [user, authLoading, navigate]);

  const handleContinue = async () => {
    if (!selectedLevel || !user) return;

    setIsSubmitting(true);
    try {
      // Update profile with familiarity level
      const { error } = await supabase
        .from("profiles")
        .update({ familiarity_level: selectedLevel })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating familiarity level:", error);
        toast.error("Failed to save. Please try again.");
        return;
      }

      // Navigate to home
      navigate("/home");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/select-market");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-bg-0 to-bg-1">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-bg-0 to-bg-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="screen-padding pt-6 pb-4"
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-text-secondary mb-6 hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-body">Back</span>
        </button>

        {/* Leo centered with context */}
        <div className="flex flex-col items-center justify-center mb-6">
          <LeoCharacter size="lg" animation="thinking" />
          {selectedMarket && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-bg-2 border border-border"
            >
              <span className="text-lg">{getMarketEmoji(selectedMarket)}</span>
              <span className="text-caption text-text-primary font-medium">
                {getMarketName(selectedMarket)}
              </span>
            </motion.div>
          )}
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-text-secondary mt-3 text-center"
          >
            This helps me personalize your journey! 🎯
          </motion.p>
        </div>

        <h1 className="text-h1 text-text-primary mb-2 text-center">
          What's your experience level?
        </h1>
        <p className="text-body text-text-secondary text-center">
          We'll adapt your 6-month path accordingly
        </p>
      </motion.div>

      {/* Level Options */}
      <div className="flex-1 screen-padding pb-40 overflow-auto">
        <div className="space-y-3 mt-4">
          {levelOptions.map((level, index) => (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
            >
              <button
                onClick={() => setSelectedLevel(level.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border-2 transition-all",
                  "bg-bg-1 hover:bg-bg-2",
                  selectedLevel === level.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      selectedLevel === level.id
                        ? "bg-accent text-white"
                        : "bg-bg-2 text-text-secondary"
                    )}
                  >
                    {level.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="text-body font-semibold text-text-primary">
                          {level.title}
                        </h3>
                        <p className="text-caption text-accent">{level.subtitle}</p>
                      </div>
                      {selectedLevel === level.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                        >
                          <Check size={14} className="text-white" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-caption text-text-secondary mb-2">
                      {level.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {level.examples.map((example) => (
                        <span
                          key={example}
                          className="chip bg-bg-2 text-text-muted text-[10px] px-2 py-0.5"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Note about outcome */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-caption text-text-muted mt-6 px-4"
        >
          No matter your starting point, everyone reaches the same mastery level by Day 180.
        </motion.p>
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 screen-padding pb-8 pt-4 bg-gradient-to-t from-bg-0 via-bg-0 to-transparent"
      >
        <Button
          size="full"
          disabled={!selectedLevel || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? "Starting..." : "Begin my journey"}
        </Button>
      </motion.div>
    </div>
  );
}
