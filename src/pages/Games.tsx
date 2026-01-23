import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Gamepad2, Trophy, Target, Zap, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GameQuestion {
  id: number;
  type: "match" | "timeline" | "predict";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const mockGameQuestions: GameQuestion[] = [
  {
    id: 1,
    type: "match",
    question: "Match the company to its main AI product:",
    options: ["ChatGPT", "Claude", "Gemini", "Llama"],
    correctAnswer: 0,
    explanation: "ChatGPT is OpenAI's flagship conversational AI product.",
  },
  {
    id: 2,
    type: "timeline",
    question: "Which came first in the AI timeline?",
    options: ["GPT-3 Launch", "ChatGPT Launch", "GPT-4 Launch", "Claude 3 Launch"],
    correctAnswer: 0,
    explanation: "GPT-3 was launched in June 2020, starting the LLM revolution.",
  },
  {
    id: 3,
    type: "predict",
    question: "What's the most likely next move for AI chip startups?",
    options: [
      "Focus on inference-only chips",
      "Compete directly with NVIDIA",
      "Target edge computing",
      "Exit to hyperscalers",
    ],
    correctAnswer: 2,
    explanation: "Edge computing offers differentiation without direct competition with NVIDIA.",
  },
];

export default function GamesPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const question = mockGameQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question?.correctAnswer;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === question.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < mockGameQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameComplete(true);
      toast.success(`Game complete! Score: ${score + (isCorrect ? 1 : 0)}/${mockGameQuestions.length}`);
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
              You scored {score}/{mockGameQuestions.length}
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
            Question {currentQuestion + 1} of {mockGameQuestions.length}
          </p>
        </div>
        <div className="chip-accent flex items-center gap-1">
          <Trophy size={14} />
          {score}
        </div>
      </motion.div>

      {/* Progress */}
      <div className="screen-padding pt-4">
        <div className="progress-thin">
          <motion.div
            className="progress-thin-fill"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / mockGameQuestions.length) * 100}%` }}
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
                    <p className="text-body text-text-secondary">{question.explanation}</p>
                  </div>

                  <Button className="w-full mt-4" onClick={handleNext}>
                    {currentQuestion < mockGameQuestions.length - 1 ? "Next Question" : "See Results"}
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
