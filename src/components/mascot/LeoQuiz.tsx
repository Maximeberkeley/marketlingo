import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LeoRig, LeoEmotion } from "./LeoRig";
import { leoMessages, getRandomLeoMessage } from "./LeoMascot";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizOption {
  label: string;
  isCorrect: boolean;
}

interface LeoQuizProps {
  question: string;
  options: QuizOption[];
  onComplete: (correct: boolean) => void;
  onDismiss?: () => void;
}

export function LeoQuiz({ question, options, onComplete, onDismiss }: LeoQuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [leoMessage, setLeoMessage] = useState(getRandomLeoMessage("quiz"));
  const [leoEmotion, setLeoEmotion] = useState<LeoEmotion>("thinking");
  const { play } = useSoundEffects();

  const handleSelect = (index: number) => {
    if (showResult) return;
    
    setSelectedIndex(index);
    const isCorrect = options[index].isCorrect;
    
    if (isCorrect) {
      play("correct");
      setLeoMessage(getRandomLeoMessage("correct"));
      setLeoEmotion("celebrate");
    } else {
      play("incorrect");
      setLeoMessage(getRandomLeoMessage("incorrect"));
      setLeoEmotion("sad");
    }
    
    setShowResult(true);
    
    // Auto-dismiss after showing result
    setTimeout(() => {
      onComplete(isCorrect);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-bg-2 rounded-2xl border border-accent/30 p-4 shadow-lg overflow-hidden"
    >
      {/* Leo with message - centered */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <LeoRig 
          size="md" 
          emotion={leoEmotion}
          message={leoMessage}
          showMessage={true}
        />
        <p className="text-body text-text-primary font-medium text-center">{question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.isCorrect;
          
          let optionStyle = "bg-bg-1 border-border hover:border-accent/50";
          if (showResult && isSelected) {
            optionStyle = isCorrect 
              ? "bg-green-500/20 border-green-500" 
              : "bg-red-500/20 border-red-500";
          } else if (showResult && isCorrect) {
            optionStyle = "bg-green-500/10 border-green-500/50";
          }

          return (
            <motion.button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${optionStyle}`}
              whileTap={!showResult ? { scale: 0.98 } : undefined}
            >
              {showResult && isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {isCorrect ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </motion.div>
              )}
              <span className="text-caption text-text-primary">{option.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Skip button */}
      {onDismiss && !showResult && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-3 text-text-muted"
          onClick={onDismiss}
        >
          Skip for now
        </Button>
      )}
    </motion.div>
  );
}

// Hook to show random quizzes at strategic moments
export function useLeoQuiz() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<{
    question: string;
    options: QuizOption[];
  } | null>(null);

  const triggerQuiz = (question: string, options: QuizOption[]) => {
    setQuizData({ question, options });
    setShowQuiz(true);
  };

  const hideQuiz = () => {
    setShowQuiz(false);
    setQuizData(null);
  };

  return {
    showQuiz,
    quizData,
    triggerQuiz,
    hideQuiz,
  };
}
