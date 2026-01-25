import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Gamepad2, Trophy, Target, Zap, CheckCircle, Loader2, Briefcase, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { mentors, Mentor } from "@/data/mentors";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GameQuestion {
  id: string;
  type: "match" | "timeline" | "predict";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  pattern: string;
}

export default function GamesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [showIntro, setShowIntro] = useState(true);

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

      // Fetch stacks with DAILY_GAME tag for this market
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
            body
          )
        `)
        .eq("market_id", market)
        .contains("tags", ["DAILY_GAME"])
        .not("published_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(5);

      if (error) {
        console.error("Error fetching games:", error);
        setLoading(false);
        return;
      }

      // Transform stacks into game questions
      const gameQuestions: GameQuestion[] = (stacks || []).map((stack, index) => {
        const slides = (stack.slides as any[]) || [];
        const sortedSlides = slides.sort((a, b) => a.slide_number - b.slide_number);
        
        // Create question from stack content
        const questionSlide = sortedSlides[0]?.body || stack.title;
        const patternSlide = sortedSlides.find(s => s.body?.toLowerCase().includes("pattern:"));
        const pattern = patternSlide?.body?.replace(/pattern:\s*/i, "") || stack.title;

        // Generate options from slides
        const options = sortedSlides.slice(1, 5).map(s => s.body?.substring(0, 60) + "..." || s.title);
        
        // Determine question type based on position
        const types: Array<"match" | "timeline" | "predict"> = ["match", "timeline", "predict"];
        const type = types[index % 3];

        return {
          id: stack.id,
          type,
          question: `${stack.title}: ${questionSlide.substring(0, 100)}`,
          options: options.length >= 4 ? options : [
            options[0] || "Option A",
            options[1] || "Option B", 
            options[2] || "Option C",
            options[3] || "Option D"
          ],
          correctAnswer: 0,
          explanation: sortedSlides[sortedSlides.length - 1]?.body || pattern,
          pattern,
        };
      });

      setQuestions(gameQuestions.length > 0 ? gameQuestions : []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question?.correctAnswer;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === question.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameComplete(true);
      const finalScore = score + (isCorrect ? 1 : 0);
      
      // Save progress to database
      if (user && selectedMarket) {
        await supabase.from("games_progress").upsert({
          user_id: user.id,
          market_id: selectedMarket,
          game_type: "pattern_match",
          score: finalScore,
          level: 1,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,market_id,game_type" });
      }
      
      toast.success(`Game complete! Score: ${finalScore}/${questions.length}`);
    }
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case "match":
        return <Target size={16} />;
      case "timeline":
        return <Zap size={16} />;
      case "predict":
        return <Trophy size={16} />;
      default:
        return <Gamepad2 size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Intro screen
  if (showIntro && questions.length > 0) {
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
          <h1 className="text-h2 text-text-primary">Games</h1>
        </motion.div>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            {/* Gradient Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 p-6 mb-6">
              <div className="absolute top-4 right-4 opacity-30">
                <Sparkles size={48} />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <Target size={28} className="text-white" />
                </div>
                <p className="text-white/80 text-caption font-medium mb-1">Pattern Games</p>
                <h2 className="text-2xl font-bold text-white mb-2">Test Your Knowledge</h2>
                <p className="text-white/90 text-body">
                  Apply what you've learned with quick MCQ challenges based on real aerospace patterns.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="card-elevated mb-6">
              <h3 className="text-h3 text-text-primary mb-3">What to expect</h3>
              <ul className="space-y-2">
                {[
                  "Multiple choice questions",
                  "Instant feedback with explanations",
                  "Startup application tips",
                  "Track your score"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-body text-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-400 hover:opacity-90" 
              size="lg"
              onClick={() => setShowIntro(false)}
            >
              Start Game
              <ChevronRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        </div>
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
          <h1 className="text-h2 text-text-primary">Games</h1>
        </motion.div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Gamepad2 size={48} className="mx-auto mb-4 text-text-muted" />
            <h2 className="text-h2 text-text-primary mb-2">No games available</h2>
            <p className="text-body text-text-secondary">Complete more lessons to unlock games!</p>
            <Button className="mt-4" onClick={() => navigate("/home")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameComplete) {
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
          <h1 className="text-h2 text-text-primary">Games</h1>
        </motion.div>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-elevated text-center max-w-sm w-full"
          >
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-success" />
            </div>
            <h2 className="text-h2 text-text-primary mb-2">Game Complete!</h2>
            <p className="text-body text-text-secondary mb-6">
              You scored {score}/{questions.length}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => navigate("/home")}>
                Home
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setCurrentQuestion(0);
                  setScore(0);
                  setSelectedAnswer(null);
                  setShowResult(false);
                  setGameComplete(false);
                }}
              >
                Play Again
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
          <h1 className="text-h2 text-text-primary">Games</h1>
          <p className="text-caption text-text-muted">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MentorAvatar
            mentor={mentors[2]}
            size="sm"
            showPulse={false}
            onClick={() => setActiveMentor(mentors[2])}
          />
          <div className="chip-accent flex items-center gap-1">
            <Trophy size={14} />
            {score}
          </div>
        </div>
      </motion.div>

      {/* Progress */}
      <div className="screen-padding pt-4">
        <div className="progress-thin">
          <motion.div
            className="progress-thin-fill"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 screen-padding py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="chip-accent flex items-center gap-1">
                {getGameIcon(question.type)}
                {question.type.toUpperCase()}
              </span>
              <span className="chip">{question.pattern}</span>
            </div>

            <h2 className="text-h2 text-text-primary mb-6">{question.question}</h2>

            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === question.correctAnswer;

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={showResult}
                    className={`w-full card-elevated text-left transition-all duration-200 ${
                      showResult
                        ? isCorrectOption
                          ? "border-success bg-success/10"
                          : isSelected
                          ? "border-destructive bg-destructive/10"
                          : ""
                        : isSelected
                        ? "selected-ring"
                        : "hover:border-primary/30"
                    }`}
                    whileTap={{ scale: showResult ? 1 : 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-semibold ${
                          showResult && isCorrectOption
                            ? "bg-success text-white"
                            : showResult && isSelected && !isCorrectOption
                            ? "bg-destructive text-white"
                            : "bg-bg-1 text-text-secondary"
                        }`}
                      >
                        {showResult && isCorrectOption ? (
                          <CheckCircle size={16} />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span className="text-body text-text-primary flex-1">{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Result Feedback */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-6"
                >
                  <div
                    className={`card-elevated ${
                      isCorrect ? "border-success/30" : "border-amber-500/30"
                    }`}
                  >
                    <p
                      className={`text-h3 mb-2 ${
                        isCorrect ? "text-success" : "text-amber-400"
                      }`}
                    >
                      {isCorrect ? "Correct!" : "Not quite"}
                    </p>
                    <p className="text-body text-text-secondary mb-3">{question.explanation}</p>
                    
                    {/* Startup Application */}
                    <div className="p-2 rounded-lg bg-accent/5 border border-accent/20">
                      <div className="flex items-center gap-2 text-caption text-accent">
                        <Briefcase size={12} />
                        <span className="font-medium">Apply This</span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        This pattern matters when pitching to investors or analyzing competitors.
                      </p>
                    </div>
                  </div>

                  <Button className="w-full mt-4" onClick={handleNext}>
                    {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
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
        context={`Game question: ${question?.question || "Pattern matching game"}`}
      />
    </div>
  );
}
