import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, TrendingUp, Rocket, Sparkles, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeoCharacter } from "@/components/mascot/LeoStateMachine";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getMarketName, getMarketEmoji } from "@/data/markets";
import { cn } from "@/lib/utils";

export type LearningGoal = "join_industry" | "invest" | "build_startup" | "curiosity";

interface GoalOption {
  id: LearningGoal;
  icon: React.ReactNode;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  emphasis: string[];
}

const goalOptions: GoalOption[] = [
  {
    id: "join_industry",
    icon: <Briefcase className="w-7 h-7" />,
    emoji: "🚀",
    title: "Join the industry",
    subtitle: "Career Move",
    description: "Prepare for interviews, understand org structures, and learn what hiring managers look for",
    emphasis: ["Job roles & skills", "Interview prep", "Org structures"],
  },
  {
    id: "invest",
    icon: <TrendingUp className="w-7 h-7" />,
    emoji: "💰",
    title: "Invest & evaluate",
    subtitle: "Investor Lens",
    description: "Master unit economics, valuations, market sizing, and due diligence frameworks",
    emphasis: ["Valuations", "Market sizing", "Due diligence"],
  },
  {
    id: "build_startup",
    icon: <Rocket className="w-7 h-7" />,
    emoji: "🏗️",
    title: "Build a startup",
    subtitle: "Founder Path",
    description: "Learn GTM strategies, fundraising, competitive moats, and regulatory pathways",
    emphasis: ["GTM strategy", "Fundraising", "Regulatory paths"],
  },
  {
    id: "curiosity",
    icon: <Sparkles className="w-7 h-7" />,
    emoji: "🧠",
    title: "Pure curiosity",
    subtitle: "Explorer Mode",
    description: "Discover big-picture trends, fascinating history, and 'wow factor' insights",
    emphasis: ["Trend analysis", "Industry history", "Key innovations"],
  },
];

export default function SelectGoalPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    const fetchMarket = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("selected_market")
          .eq("id", user.id)
          .single();

        if (!profile?.selected_market) {
          navigate("/select-market");
          return;
        }

        setSelectedMarket(profile.selected_market);

        // Check if user already has a goal for this market — skip if so
        const { data: progress } = await supabase
          .from("user_progress")
          .select("learning_goal, familiarity_level")
          .eq("user_id", user.id)
          .eq("market_id", profile.selected_market)
          .single();

        if (progress?.learning_goal && progress?.familiarity_level) {
          navigate("/home");
        } else if (progress?.learning_goal) {
          navigate("/select-familiarity");
        }
      } catch (err) {
        console.error("Error fetching market:", err);
        navigate("/select-market");
      }
    };

    fetchMarket();
  }, [user, authLoading, navigate]);

  const handleContinue = async () => {
    if (!selectedGoal || !user || !selectedMarket) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_progress")
        .upsert(
          {
            user_id: user.id,
            market_id: selectedMarket,
            learning_goal: selectedGoal,
          },
          { onConflict: "user_id,market_id" }
        );

      if (error) {
        console.error("Error saving learning goal:", error);
        toast.error("Failed to save. Please try again.");
        return;
      }

      navigate("/select-familiarity");
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

        <div className="flex flex-col items-center justify-center mb-6">
          <LeoCharacter size="lg" animation="celebrating" />
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
            This shapes your entire learning journey! 🎯
          </motion.p>
        </div>

        <h1 className="text-h1 text-text-primary mb-2 text-center">
          Why are you learning?
        </h1>
        <p className="text-body text-text-secondary text-center">
          We'll prioritize content that matches your goal
        </p>
      </motion.div>

      {/* Goal Options */}
      <div className="flex-1 screen-padding pb-40 overflow-auto">
        <div className="space-y-3 mt-4">
          {goalOptions.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
            >
              <button
                onClick={() => setSelectedGoal(goal.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border-2 transition-all",
                  "bg-bg-1 hover:bg-bg-2",
                  selectedGoal === goal.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors text-2xl",
                      selectedGoal === goal.id
                        ? "bg-accent text-white"
                        : "bg-bg-2"
                    )}
                  >
                    {goal.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="text-body font-semibold text-text-primary">
                          {goal.title}
                        </h3>
                        <p className="text-caption text-accent">{goal.subtitle}</p>
                      </div>
                      {selectedGoal === goal.id && (
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
                      {goal.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {goal.emphasis.map((item) => (
                        <span
                          key={item}
                          className="chip bg-bg-2 text-text-muted text-[10px] px-2 py-0.5"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-caption text-text-muted mt-6 px-4"
        >
          You can change this anytime in Settings. Your goal shapes content priority, not access.
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
          disabled={!selectedGoal || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </Button>
      </motion.div>
    </div>
  );
}
