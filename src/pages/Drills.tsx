import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, CheckCircle, XCircle, RotateCcw, Loader2, Target, TrendingUp, ChevronRight, BookOpen, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { LeoCelebration } from "@/components/mascot/LeoCelebration";
import { MascotBreak, InlineMascot, MascotReaction, getRandomCharacter } from "@/components/mascot";
import { DailyLimitGate, RemainingCount } from "@/components/subscription/DailyLimitGate";
import { FloatingXP } from "@/components/ui/FloatingXP";
import { mentors, Mentor } from "@/data/mentors";
import { getMarketConfig, getPrimaryMentorForMarket } from "@/data/marketConfig";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContentAccess } from "@/hooks/useContentAccess";
import { getXPAmount } from "@/hooks/useUserXP";
import { smartTruncate } from "@/lib/text-utils";
import { useMascotState } from "@/hooks/useMascotState";

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
  const [floatingXP, setFloatingXP] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  const { state: mascotState, handleAnswer: triggerMascotReaction, setIdle } = useMascotState();
  
  // Get market config for theming
  const marketConfig = selectedMarket ? getMarketConfig(selectedMarket) : null;
  const primaryMentorId = selectedMarket ? getPrimaryMentorForMarket(selectedMarket) : "alex";
  const primaryMentor = mentors.find(m => m.id === primaryMentorId) || mentors[1];

  const [currentDay, setCurrentDay] = useState<number>(1);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string | null>(null);
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);

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

      // Get user progress for current day, streak & goal
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("learning_goal, current_day, current_streak")
        .eq("user_id", user.id)
        .eq("market_id", market)
        .maybeSingle();

      const learningGoal = progressData?.learning_goal || "curiosity";
      const goalTag = `goal:${learningGoal}`;
      const day = progressData?.current_day || 1;
      setCurrentDay(day);
      setCurrentStreak(progressData?.current_streak || 0);

      // Get best previous accuracy
      const { data: prevDrill } = await supabase
        .from("drills_progress")
        .select("completed_count, correct_count")
        .eq("user_id", user.id)
        .eq("market_id", market)
        .eq("drill_type", "true_false")
        .maybeSingle();
      if (prevDrill?.completed_count && prevDrill?.correct_count) {
        setBestAccuracy(Math.round((prevDrill.correct_count / (prevDrill.completed_count * 5)) * 100));
      }

      // Get current day's lesson title for context
      const { data: currentStack } = await supabase
        .from("stacks")
        .select("title")
        .eq("market_id", market)
        .contains("tags", ["MICRO_LESSON", `day-${day}`])
        .not("published_at", "is", null)
        .limit(1)
        .maybeSingle();
      if (currentStack) setCurrentLessonTitle(currentStack.title);

      // Fetch drill questions from the dedicated drill_questions table
      // Priority: current day → closest available day → any
      let drillQuestions: DrillQuestion[] = [];

      const { data: dayDrills } = await supabase
        .from("drill_questions")
        .select("id, category, statement, is_true, explanation, source_label")
        .eq("market_id", market)
        .eq("day_number", day)
        .limit(10);

      if (dayDrills?.length) {
        drillQuestions = dayDrills.map((d: any) => ({
          id: d.id,
          category: d.category || "Market Insight",
          statement: smartTruncate(d.statement, 280),
          isTrue: d.is_true,
          explanation: smartTruncate(d.explanation, 280),
          source: d.source_label || "Industry Analysis",
        }));
      }

      // Fallback: grab from nearby days
      if (!drillQuestions.length) {
        const { data: nearbyDrills } = await supabase
          .from("drill_questions")
          .select("id, category, statement, is_true, explanation, source_label")
          .eq("market_id", market)
          .lte("day_number", day)
          .order("day_number", { ascending: false })
          .limit(10);

        if (nearbyDrills?.length) {
          drillQuestions = nearbyDrills.map((d: any) => ({
            id: d.id,
            category: d.category || "Market Insight",
            statement: smartTruncate(d.statement, 280),
            isTrue: d.is_true,
            explanation: smartTruncate(d.explanation, 280),
            source: d.source_label || "Industry Analysis",
          }));
        }
      }

      // Final fallback: generate from slide content if no drill_questions exist
      if (!drillQuestions.length) {
        const { data: stacks } = await supabase
          .from("stacks")
          .select(`id, title, tags, slides (id, slide_number, title, body, sources)`)
          .eq("market_id", market)
          .contains("tags", ["MICRO_LESSON", `day-${day}`])
          .not("published_at", "is", null)
          .limit(5);

        const allStacks = stacks?.length ? stacks : (await supabase
          .from("stacks")
          .select(`id, title, tags, slides (id, slide_number, title, body, sources)`)
          .eq("market_id", market)
          .not("published_at", "is", null)
          .limit(20)).data || [];

        const shuffled = [...allStacks].sort(() => Math.random() - 0.5);

        shuffled.forEach((stack: any) => {
          const slides = (stack.slides as any[]) || [];
          slides.forEach((slide: any, index: number) => {
            if (slide.body && slide.body.length > 20 && drillQuestions.length < 10) {
              const isTrue = index % 2 === 0;
              let statement = slide.body;
              if (!isTrue) {
                statement = statement
                  .replace(/always/gi, "never")
                  .replace(/important/gi, "irrelevant")
                  .replace(/key/gi, "minor");
              }
              const sources = slide.sources as any[] || [];
              drillQuestions.push({
                id: slide.id,
                category: (stack.tags as string[])?.[0] || "Market Insight",
                statement: smartTruncate(statement, 280),
                isTrue,
                explanation: smartTruncate(slide.body, 280),
                source: sources[0]?.label || "Industry Analysis",
              });
            }
          });
        });
      }

      // Shuffle and limit to 5
      drillQuestions = drillQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
      setQuestions(drillQuestions);
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

    const isCorrect = answer === question.isTrue;
    triggerMascotReaction(isCorrect);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      const xpGain = getXPAmount(10, isProUser);
      setFloatingXP({ amount: xpGain, show: false });
      setTimeout(() => setFloatingXP({ amount: xpGain, show: true }), 50);
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      // Advance to next question
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
      setIsTimerActive(true);
      setIdle();
    } else {
      // Last question done — compute final score using current state
      const finalScore = score + (selectedAnswer !== null && selectedAnswer === question?.isTrue ? 1 : 0);
      const percentage = Math.round((finalScore / questions.length) * 100);

      // Adaptive XP: more XP for higher accuracy (Pro users get 1.5x)
      const baseXP = percentage >= 80 ? 20 : percentage >= 60 ? 12 : 5;
      const xpEarned = getXPAmount(baseXP, isProUser);

      // Save progress
      if (user && selectedMarket) {
        await supabase.from("drills_progress").upsert({
          user_id: user.id,
          market_id: selectedMarket,
          drill_type: "true_false",
          completed_count: 1,
          correct_count: finalScore,
          last_completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,market_id,drill_type" });

        // Award adaptive XP
        await supabase.from("xp_transactions").insert({
          user_id: user.id,
          market_id: selectedMarket,
          xp_amount: xpEarned,
          source_type: "drill",
          description: `Drill complete — ${percentage}% accuracy → ${xpEarned} XP`,
        });
      }

      // Always show Leo celebration
      setShowCelebration(true);
      toast.success(`Drill complete! ${finalScore}/${questions.length} correct · +${xpEarned} XP`);
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

        <div className="flex-1 screen-padding py-6 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Hero Card */}
            <div className={`relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br ${marketConfig?.heroGradient || 'from-amber-600 via-orange-700 to-red-900'}`}>
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative p-6 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Target size={16} className="text-white" />
                  </div>
                  <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">{marketConfig?.name || 'Industry'} Drills</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1.5">15-Second Challenges</h2>
                <p className="text-white/75 text-sm leading-relaxed">
                  {marketConfig?.drillDescription || 'Rapid-fire True/False to build pattern recognition.'}
                </p>
              </div>
            </div>

            {/* Current Lesson Context */}
            {currentLessonTitle && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/15 mb-5"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Today's Lesson · Day {currentDay}</p>
                  <p className="text-sm text-text-primary font-medium truncate">{currentLessonTitle}</p>
                </div>
              </motion.div>
            )}

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mb-5"
            >
              <div className="rounded-2xl bg-bg-2 border border-border p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{questions.length}</p>
                <p className="text-[11px] text-text-muted">Questions</p>
              </div>
              <div className="rounded-2xl bg-bg-2 border border-border p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Timer size={14} className="text-amber-400" />
                  <p className="text-lg font-bold text-text-primary">15s</p>
                </div>
                <p className="text-[11px] text-text-muted">Per Question</p>
              </div>
              <div className="rounded-2xl bg-bg-2 border border-border p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{bestAccuracy !== null ? `${bestAccuracy}%` : '—'}</p>
                <p className="text-[11px] text-text-muted">Best Accuracy</p>
              </div>
            </motion.div>

            {/* Mascot */}
            <MascotBreak
              type="intro"
              marketId={selectedMarket || undefined}
              message="Let's test your instincts! 15 seconds per question — trust your gut! 🎯"
              className="mb-5"
            />

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-elevated mb-6 p-5"
            >
              <h3 className="text-h3 text-text-primary mb-3">How it works</h3>
              <ul className="space-y-2.5">
                {[
                  { icon: <Timer size={14} />, text: "15 seconds per question" },
                  { icon: <CheckCircle size={14} />, text: "True or False answers" },
                  { icon: <TrendingUp size={14} />, text: "Based on real industry facts" },
                  { icon: <Target size={14} />, text: "Build intuition fast" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      {feature.icon}
                    </div>
                    {feature.text}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CTA */}
            <Button 
              className="w-full h-14 text-base font-semibold rounded-2xl" 
              size="lg"
              onClick={() => {
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
      <FloatingXP amount={floatingXP.amount} show={floatingXP.show} isPro={isProUser} />
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
      <div className="flex-1 screen-padding py-6 flex flex-col overflow-y-auto modal-bottom-safe relative">
        {/* Reactive Mascot - floats at bottom right */}
        <MascotReaction
          state={mascotState}
          size="md"
          position="bottom-right"
          showMessage={mascotState !== "idle"}
          className="!bottom-32"
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            {/* Show mascot on first and last question */}
            {(currentQuestion === 0 || currentQuestion === questions.length - 1) && (
              <InlineMascot
                marketId={selectedMarket || undefined}
                message={currentQuestion === 0 ? "You got this! 💪" : "Almost there!"}
                position={currentQuestion === 0 ? "left" : "right"}
                size="sm"
                className="mb-3"
              />
            )}
            
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

      {/* Leo Celebration on completion */}
      <LeoCelebration
        isVisible={showCelebration}
        type="drill"
        isPerfect={score === questions.length && questions.length > 0}
        onComplete={() => {
          setShowCelebration(false);
          setDrillComplete(true);
        }}
      />
    </div>
  );
}
