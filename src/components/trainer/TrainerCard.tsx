import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Bookmark, ArrowRight, MessageCircle, Lightbulb, AlertTriangle, Brain, TrendingUp, Briefcase } from "lucide-react";

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
  onAskMentor?: (question: string) => void;
}

type EvaluationLevel = "strong" | "needs-work" | "off-track";

export function TrainerCard({ scenario, onSaveToNotebook, onNext, onAskMentor }: TrainerCardProps) {
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
              {/* Pro Reasoning - What experts do */}
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <h4 className="text-caption font-semibold text-green-400">Pro Reasoning</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">{scenario.feedbackProReasoning}</p>
              </div>
              
              {/* Common Mistake - What to avoid */}
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h4 className="text-caption font-semibold text-amber-400">Common Mistake</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">{scenario.feedbackCommonMistake}</p>
              </div>
              
              {/* Mental Model - Framework for thinking */}
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-blue-400" />
                  <h4 className="text-caption font-semibold text-blue-400">Mental Model</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">{scenario.feedbackMentalModel}</p>
              </div>
              
              {/* Startup Application - How to apply this */}
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-accent" />
                  <h4 className="text-caption font-semibold text-accent">For Your Startup</h4>
                </div>
                <p className="text-body text-text-muted italic leading-relaxed">{scenario.followUpQuestion}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-3">
                <Button variant="secondary" size="default" className="flex-1" onClick={onSaveToNotebook}>
                  <Bookmark size={18} />
                  Save
                </Button>
                <Button variant="cta" size="default" className="flex-1" onClick={onNext}>
                  Next
                  <ArrowRight size={18} />
                </Button>
              </div>
              {onAskMentor && (
                <Button 
                  variant="ghost" 
                  size="default" 
                  className="w-full text-text-muted hover:text-accent"
                  onClick={() => onAskMentor(scenario.followUpQuestion)}
                >
                  <MessageCircle size={18} />
                  Discuss with mentor
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
