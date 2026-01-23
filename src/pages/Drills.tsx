import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, CheckCircle, XCircle, RotateCcw, Loader2, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DrillQuestion {
  id: string;
  category: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
}

export default function DrillsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Get user's selected market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      const market = profile?.selected_market || "aerospace";
      setSelectedMarket(market);

      // Fetch slides from stacks for this market to create drill questions
      const { data: stacks, error } = await supabase
        .from("stacks")
        .select(`
          id,
          title,
          tags,
          slides (
            id,
            slide_number,
            title,
            body,
            sources
          )
        `)
        .eq("market_id", market)
        .not("published_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(10);

      if (error) {
        console.error("Error fetching drills:", error);
        setLoading(false);
        return;
      }

      // Transform slides into True/False drill questions
      const drillQuestions: DrillQuestion[] = [];
      
      (stacks || []).forEach((stack) => {
        const slides = (stack.slides as any[]) || [];
        const tags = (stack.tags as string[]) || [];
        const category = tags[0] || "Market Insight";
        
        slides.forEach((slide, index) => {
          if (slide.body && slide.body.length > 20 && drillQuestions.length < 10) {
            // Create a true statement from the slide content
            const isTrue = index % 2 === 0; // Alternate true/false
            let statement = slide.body;
            
            // For false statements, slightly modify the content
            if (!isTrue) {
              statement = statement
                .replace(/always/gi, "never")
                .replace(/important/gi, "irrelevant")
                .replace(/key/gi, "minor");
            }

            const sources = slide.sources as any[] || [];
            const sourceLabel = sources[0]?.label || "Industry Analysis";

            drillQuestions.push({
              id: slide.id,
              category,
              statement: statement.substring(0, 200),
              isTrue,
              explanation: slide.body,
              source: sourceLabel,
            });
          }
        });
      });

      setQuestions(drillQuestions.slice(0, 5));
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question?.isTrue;

  // Timer
  useEffect(() => {
    if (!isTimerActive || showResult || loading || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowResult(true);
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, showResult, currentQuestion, loading, questions.length]);

  const handleAnswer = (answer: boolean) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setIsTimerActive(false);

    if (answer === question.isTrue) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
      setIsTimerActive(true);
    } else {
      setDrillComplete(true);
      const finalScore = score + (isCorrect ? 1 : 0);

      // Save progress to database
      if (user && selectedMarket) {
        await supabase.from("drills_progress").upsert({
          user_id: user.id,
          market_id: selectedMarket,
          drill_type: "true_false",
          completed_count: 1,
          correct_count: finalScore,
          last_completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,market_id,drill_type" });
      }

      toast.success(`Drill complete! Score: ${finalScore}/${questions.length}`);
    }
  };

  const restartDrill = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setDrillComplete(false);
    setTimeLeft(15);
    setIsTimerActive(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-4 pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Drills</h1>
        </motion.div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Target size={48} className="mx-auto mb-4 text-text-muted" />
            <h2 className="text-h2 text-text-primary mb-2">No drills available</h2>
            <p className="text-body text-text-secondary">Complete more lessons to unlock drills!</p>
            <Button className="mt-4" onClick={() => navigate("/home")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (drillComplete) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-4 pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Drills</h1>
        </motion.div>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-elevated text-center max-w-sm w-full"
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                percentage >= 80
                  ? "bg-success/20"
                  : percentage >= 60
                  ? "bg-amber-500/20"
                  : "bg-destructive/20"
              }`}
            >
              <span
                className={`text-h1 ${
                  percentage >= 80
                    ? "text-success"
                    : percentage >= 60
                    ? "text-amber-400"
                    : "text-destructive"
                }`}
              >
                {percentage}%
              </span>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">Drill Complete!</h2>
            <p className="text-body text-text-secondary mb-2">
              {finalScore}/{questions.length} correct
            </p>
            <p className="text-caption text-text-muted mb-6">
              {percentage >= 80
                ? "Excellent! You're market-fluent."
                : percentage >= 60
                ? "Good progress. Keep practicing!"
                : "Review and try again."}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => navigate("/home")}>
                Home
              </Button>
              <Button className="flex-1" onClick={restartDrill}>
                <RotateCcw size={16} className="mr-2" />
                Retry
              </Button>
            </div>
          </motion.div>
        </div>
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
        <div className="flex-1">
          <h1 className="text-h2 text-text-primary">True or False</h1>
          <p className="text-caption text-text-muted">
            {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <div
          className={`chip flex items-center gap-1 ${
            timeLeft <= 5 ? "bg-destructive/20 text-destructive" : ""
          }`}
        >
          <Timer size={14} />
          {timeLeft}s
        </div>
      </motion.div>

      {/* Progress */}
      <div className="screen-padding pt-4">
        <div className="progress-thin">
          <motion.div
            className="progress-thin-fill"
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 screen-padding py-6 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <span className="chip-accent w-fit mb-4">{question.category}</span>

            <div className="flex-1 flex items-center">
              <p className="text-h2 text-text-primary leading-relaxed">{question.statement}</p>
            </div>

            {/* Answer Buttons */}
            {!showResult && (
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1 h-14"
                  onClick={() => handleAnswer(false)}
                >
                  <XCircle size={20} className="mr-2 text-destructive" />
                  False
                </Button>
                <Button className="flex-1 h-14" onClick={() => handleAnswer(true)}>
                  <CheckCircle size={20} className="mr-2" />
                  True
                </Button>
              </div>
            )}

            {/* Result */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <div
                    className={`card-elevated mb-4 ${
                      isCorrect || selectedAnswer === null
                        ? isCorrect
                          ? "border-success/30"
                          : "border-amber-500/30"
                        : "border-destructive/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {selectedAnswer === null ? (
                        <span className="text-h3 text-amber-400">Time's up!</span>
                      ) : isCorrect ? (
                        <>
                          <CheckCircle size={20} className="text-success" />
                          <span className="text-h3 text-success">Correct!</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={20} className="text-destructive" />
                          <span className="text-h3 text-destructive">Incorrect</span>
                        </>
                      )}
                    </div>
                    <p className="text-body text-text-secondary mb-2">{question.explanation}</p>
                    <p className="text-caption text-text-muted">Source: {question.source}</p>
                  </div>

                  <Button className="w-full" onClick={handleNext}>
                    {currentQuestion < questions.length - 1 ? "Next" : "See Results"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
