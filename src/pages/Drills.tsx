import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DrillQuestion {
  id: number;
  category: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
}

const mockDrillQuestions: DrillQuestion[] = [
  {
    id: 1,
    category: "Funding",
    statement: "OpenAI has raised over $10 billion in total funding.",
    isTrue: true,
    explanation: "OpenAI has raised approximately $11.3B, with Microsoft being the primary investor.",
    source: "Crunchbase",
  },
  {
    id: 2,
    category: "Market",
    statement: "The global AI market is expected to reach $500B by 2030.",
    isTrue: false,
    explanation: "Current projections estimate the global AI market to reach $1.8T+ by 2030.",
    source: "McKinsey",
  },
  {
    id: 3,
    category: "Competition",
    statement: "Google's Gemini Ultra outperformed GPT-4 on all benchmarks at launch.",
    isTrue: false,
    explanation: "While Gemini Ultra matched or exceeded GPT-4 on some benchmarks, it didn't outperform on all.",
    source: "Google Research",
  },
  {
    id: 4,
    category: "Hardware",
    statement: "NVIDIA controls over 80% of the AI chip market.",
    isTrue: true,
    explanation: "NVIDIA's data center GPUs dominate the AI training market with 80-90% share.",
    source: "Reuters",
  },
  {
    id: 5,
    category: "Enterprise",
    statement: "Less than 20% of enterprises have deployed AI in production.",
    isTrue: false,
    explanation: "As of 2024, over 50% of enterprises report having AI in production.",
    source: "Gartner",
  },
];

export default function DrillsPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const question = mockDrillQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question?.isTrue;

  // Timer
  useEffect(() => {
    if (!isTimerActive || showResult) return;

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
  }, [isTimerActive, showResult, currentQuestion]);

  const handleAnswer = (answer: boolean) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setIsTimerActive(false);

    if (answer === question.isTrue) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < mockDrillQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
      setIsTimerActive(true);
    } else {
      setDrillComplete(true);
      const finalScore = score + (isCorrect ? 1 : 0);
      toast.success(`Drill complete! Score: ${finalScore}/${mockDrillQuestions.length}`);
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

  if (drillComplete) {
    const finalScore = score;
    const percentage = Math.round((finalScore / mockDrillQuestions.length) * 100);

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
              {finalScore}/{mockDrillQuestions.length} correct
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
            {currentQuestion + 1} of {mockDrillQuestions.length}
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
            animate={{ width: `${((currentQuestion + 1) / mockDrillQuestions.length) * 100}%` }}
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
                    {currentQuestion < mockDrillQuestions.length - 1 ? "Next" : "See Results"}
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
