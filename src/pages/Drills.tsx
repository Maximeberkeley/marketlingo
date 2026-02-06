import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, CheckCircle, XCircle, RotateCcw, Loader2, Target, Lightbulb, TrendingUp, Zap, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { MentorCelebration } from "@/components/mascot/MentorCelebration";
import { DailyLimitGate, RemainingCount } from "@/components/subscription/DailyLimitGate";
import { mentors, Mentor } from "@/data/mentors";
import { getMarketConfig, getPrimaryMentorForMarket } from "@/data/marketConfig";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContentAccess } from "@/hooks/useContentAccess";
import { smartTruncate } from "@/lib/text-utils";

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
  const { checkDailyLimit, incrementUsage, isProUser } = useContentAccess();
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLimitGate, setShowLimitGate] = useState(false);
  
  // Get market config for theming
  const marketConfig = selectedMarket ? getMarketConfig(selectedMarket) : null;
  const primaryMentorId = selectedMarket ? getPrimaryMentorForMarket(selectedMarket) : "alex";
  const primaryMentor = mentors.find(m => m.id === primaryMentorId) || mentors[1];

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

            // Use smart truncation to avoid mid-word/mid-sentence cuts
            const truncatedStatement = smartTruncate(statement, 280);

            const sources = slide.sources as any[] || [];
            const sourceLabel = sources[0]?.label || "Industry Analysis";

            drillQuestions.push({
              id: slide.id,
              category,
              statement: truncatedStatement,
              isTrue,
              explanation: smartTruncate(slide.body, 280),
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

      // Show celebration randomly (60% of the time)
      if (Math.random() < 0.6) {
        setShowCelebration(true);
      } else {
        setDrillComplete(true);
        toast.success(`Drill complete! Score: ${finalScore}/${questions.length}`);
      }
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

  // Check daily limit
  const drillsLimit = checkDailyLimit('drills');

  // Daily limit gate
  if (!isProUser && showLimitGate) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Drills</h1>
        </motion.div>
        <div className="flex-1 flex items-center justify-center screen-padding py-6">
          <DailyLimitGate 
            type="drills" 
            onContinue={() => setShowLimitGate(false)} 
          />
        </div>
      </div>
    );
  }

  // Intro screen
  if (showIntro && questions.length > 0) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Drills</h1>
          {!isProUser && (
            <RemainingCount type="drills" className="ml-auto" />
          )}
        </motion.div>

        <div className="flex-1 flex items-center justify-center screen-padding py-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            {/* Hero Card with Market-Specific Gradient */}
            <div className={`relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br ${marketConfig?.heroGradient || 'from-amber-600 via-orange-700 to-red-900'}`}>
              <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
              <div className="relative p-6 pt-8 pb-6 min-h-[200px] flex flex-col justify-end">
                {/* Mentor avatar - positioned with breathing room */}
                <div className="absolute top-5 right-5">
                  <img 
                    src={primaryMentor.avatar} 
                    alt={primaryMentor.name}
                    className="w-14 h-14 rounded-full border-2 border-white/30 object-cover object-[50%_30%]"
                  />
                </div>
                <p className="text-white/80 text-caption font-medium mb-2">{marketConfig?.name || 'Industry'} Drills</p>
                <h2 className="text-2xl font-bold text-white mb-3 pr-20">15-Second Challenges</h2>
                <p className="text-white/90 text-body leading-relaxed">
                  {marketConfig?.drillDescription || 'Rapid-fire True/False to build pattern recognition.'}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="card-elevated mb-6 p-5">
              <h3 className="text-h3 text-text-primary mb-4">How it works</h3>
              <ul className="space-y-3">
                {[
                  "15 seconds per question",
                  "True or False answers",
                  "Based on real industry facts",
                  "Build intuition fast"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-body text-text-secondary">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                // Check limit before starting
                if (!drillsLimit.canAccess) {
                  setShowLimitGate(true);
                  return;
                }
                incrementUsage('drills');
                setShowIntro(false);
                setIsTimerActive(true);
              }}
            >
              Start Drill
              <ChevronRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Drills</h1>
        </motion.div>
        <div className="flex-1 flex items-center justify-center screen-padding py-6">
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
      <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Drills</h1>
        </motion.div>

        <div className="flex-1 flex items-center justify-center screen-padding py-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-elevated text-center w-full"
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
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => navigate("/home")}>
                Home
              </Button>
              <Button onClick={restartDrill}>
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
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
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
        <div className="flex items-center gap-2">
          <MentorAvatar
            mentor={mentors[1]}
            size="sm"
            showPulse={false}
            onClick={() => setActiveMentor(mentors[1])}
          />
          <div
            className={`chip flex items-center gap-1 ${
              timeLeft <= 5 ? "bg-destructive/20 text-destructive" : ""
            }`}
          >
            <Timer size={14} />
            {timeLeft}s
          </div>
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

      {/* Question - with bottom safe area for scroll content */}
      <div className="flex-1 screen-padding py-6 flex flex-col overflow-y-auto modal-bottom-safe">
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
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="h-14"
                  onClick={() => handleAnswer(false)}
                >
                  <XCircle size={20} className="mr-2 text-destructive" />
                  False
                </Button>
                <Button className="h-14" onClick={() => handleAnswer(true)}>
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
                    <p className="text-caption text-text-muted mb-3">Source: {question.source}</p>
                    
                    {/* Startup Application Tip */}
                    <div className="p-2 rounded-lg bg-accent/5 border border-accent/20">
                      <div className="flex items-center gap-2 text-caption text-accent">
                        <TrendingUp size={12} />
                        <span className="font-medium">Startup Insight</span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        Understanding this helps you evaluate market dynamics when building in {selectedMarket ? selectedMarket.replace(/-/g, ' ') : 'your industry'}.
                      </p>
                    </div>
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

      {/* Mentor Chat Overlay */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={`Drill question: ${question?.statement || "Market drill"}`}
        marketId={selectedMarket || undefined}
      />

      {/* Celebration on completion */}
      <MentorCelebration
        isVisible={showCelebration}
        marketId={selectedMarket || "aerospace"}
        type="drill"
        onComplete={() => {
          setShowCelebration(false);
          setDrillComplete(true);
        }}
      />
    </div>
  );
}
