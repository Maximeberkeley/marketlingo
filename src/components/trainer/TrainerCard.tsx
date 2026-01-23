import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Bookmark, ArrowRight, MessageCircle } from "lucide-react";

interface TrainerOption {
  label: string;
  isCorrect: boolean;
}

interface TrainerScenario {
  scenario: string;
  question: string;
  options: TrainerOption[];
  feedbackProReasoning: string;
  feedbackCommonMistake: string;
  feedbackMentalModel: string;
  followUpQuestion: string;
}

interface TrainerCardProps {
  scenario: TrainerScenario;
  onSaveToNotebook: () => void;
  onNext: () => void;
}

type EvaluationLevel = "strong" | "needs-work" | "off-track";

export function TrainerCard({ scenario, onSaveToNotebook, onNext }: TrainerCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationLevel | null>(null);
  
  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    
    setSelectedIndex(index);
    const isCorrect = scenario.options[index].isCorrect;
    setEvaluation(isCorrect ? "strong" : "needs-work");
    
    // Slight delay before showing feedback
    setTimeout(() => {
      setShowFeedback(true);
    }, 300);
  };
  
  const evaluationStyles: Record<EvaluationLevel, { bg: string; text: string; label: string }> = {
    strong: { bg: "bg-green-500/20", text: "text-green-400", label: "Strong" },
    "needs-work": { bg: "bg-amber-500/20", text: "text-amber-400", label: "Needs Work" },
    "off-track": { bg: "bg-red-500/20", text: "text-red-400", label: "Off Track" },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scenario */}
      <div className="card-elevated mb-4">
        <p className="text-body text-text-secondary leading-relaxed">
          {scenario.scenario}
        </p>
      </div>
      
      {/* Question */}
      <h3 className="text-h3 text-text-primary mb-4">{scenario.question}</h3>
      
      {/* Options */}
      <div className="space-y-3 mb-6">
        {scenario.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.isCorrect;
          
          let optionStyle = "";
          if (showFeedback && isSelected) {
            optionStyle = isCorrect ? "border-green-500 bg-green-500/10" : "border-amber-500 bg-amber-500/10";
          } else if (showFeedback && isCorrect) {
            optionStyle = "border-green-500/50";
          } else if (isSelected) {
            optionStyle = "border-primary";
          }
          
          return (
            <motion.button
              key={index}
              whileTap={!showFeedback ? { scale: 0.98 } : undefined}
              onClick={() => handleOptionSelect(index)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-card border text-left transition-all no-select ${
                optionStyle || "border-border bg-bg-2 hover:border-text-muted"
              }`}
            >
              <span className="text-body text-text-primary">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
      
      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-auto"
          >
            {/* Evaluation Badge */}
            <div className="flex justify-center mb-4">
              <span className={`chip ${evaluationStyles[evaluation].bg} ${evaluationStyles[evaluation].text}`}>
                {evaluationStyles[evaluation].label}
              </span>
            </div>
            
            {/* Feedback Card */}
            <div className="card-elevated space-y-4">
              <div>
                <h4 className="text-caption text-primary mb-1">Pro Reasoning</h4>
                <p className="text-body text-text-secondary">{scenario.feedbackProReasoning}</p>
              </div>
              
              <div>
                <h4 className="text-caption text-amber-400 mb-1">Common Mistake</h4>
                <p className="text-body text-text-secondary">{scenario.feedbackCommonMistake}</p>
              </div>
              
              <div>
                <h4 className="text-caption text-blue-400 mb-1">Mental Model</h4>
                <p className="text-body text-text-secondary">{scenario.feedbackMentalModel}</p>
              </div>
              
              <div className="pt-3 border-t border-border">
                <div className="flex items-start gap-2">
                  <MessageCircle size={16} className="text-text-muted mt-0.5" />
                  <p className="text-body text-text-muted italic">{scenario.followUpQuestion}</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="default" className="flex-1" onClick={onSaveToNotebook}>
                <Bookmark size={18} />
                Save to notebook
              </Button>
              <Button variant="cta" size="default" className="flex-1" onClick={onNext}>
                Next scenario
                <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
