import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Bookmark, ArrowRight, MessageCircle, AlertTriangle, Brain, TrendingUp, Briefcase, HelpCircle, X, Sparkles } from "lucide-react";

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
  whyThisScenario?: string;
}

interface TrainerCardProps {
  scenario: TrainerScenario;
  onSaveToNotebook: () => void;
  onNext: () => void;
  onAskMentor?: (question: string) => void;
}

type EvaluationLevel = "strong" | "needs-work" | "off-track";

// Generate contextual "why this scenario" explanations
function getWhyThisScenario(scenario: string, question: string): string {
  const text = `${scenario} ${question}`.toLowerCase();
  
  if (text.includes("buyer") || text.includes("procurement") || text.includes("purchase")) {
    return "Understanding buyer psychology is crucial for aerospace sales. This scenario teaches you to navigate complex purchasing committees where technical champions rarely control budgets.";
  }
  if (text.includes("certification") || text.includes("faa") || text.includes("do-178")) {
    return "Certification is the #1 barrier to aerospace market entry. Founders who master regulatory strategy save years of delays and millions in development costs.";
  }
  if (text.includes("supply") || text.includes("tier") || text.includes("oem")) {
    return "Supply chain positioning determines your pricing power, sales cycles, and growth trajectory. Choosing the wrong tier can trap startups for years.";
  }
  if (text.includes("vc") || text.includes("investor") || text.includes("fundrais") || text.includes("funding")) {
    return "Aerospace investors evaluate differently than tech VCs. Understanding their criteria—regulatory risk, certification timelines, market size—is essential for successful fundraising.";
  }
  if (text.includes("defense") || text.includes("government") || text.includes("contract")) {
    return "Government contracts can provide stable revenue but come with unique compliance requirements. This scenario prepares you for navigating the defense market.";
  }
  if (text.includes("partner") || text.includes("integration") || text.includes("pilot program")) {
    return "Strategic partnerships accelerate market entry but require careful negotiation. Learning to structure pilot programs protects your IP while proving value.";
  }
  
  return "This scenario develops pattern recognition for common industry situations. The mental models here transfer across many aerospace business contexts.";
}

export function TrainerCard({ scenario, onSaveToNotebook, onNext, onAskMentor }: TrainerCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationLevel | null>(null);
  const [showWhyPopup, setShowWhyPopup] = useState(false);
  
  // Reset state when scenario changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowFeedback(false);
    setEvaluation(null);
  }, [scenario.question]); // Use question as key since it's unique per scenario
  
  const whyExplanation = scenario.whyThisScenario || getWhyThisScenario(scenario.scenario, scenario.question);
  
  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    
    setSelectedIndex(index);
    const isCorrect = scenario.options[index].isCorrect;
    setEvaluation(isCorrect ? "strong" : "needs-work");
    
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
    <div className="flex flex-col h-full relative">
      {/* Why This Scenario Button - Top Right */}
      <button
        onClick={() => setShowWhyPopup(true)}
        className="absolute -top-2 right-0 w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center hover:bg-accent/20 transition-colors z-10"
        title="Why this scenario?"
      >
        <HelpCircle size={16} className="text-accent" />
      </button>
      
      {/* Scenario */}
      <div className="card-elevated mb-4 pr-10">
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
              {/* Pro Reasoning */}
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <h4 className="text-caption font-semibold text-green-400">Pro Reasoning</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">{scenario.feedbackProReasoning}</p>
              </div>
              
              {/* Common Mistake */}
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h4 className="text-caption font-semibold text-amber-400">Common Mistake</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">{scenario.feedbackCommonMistake}</p>
              </div>
              
              {/* Mental Model */}
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-blue-400" />
                  <h4 className="text-caption font-semibold text-blue-400">Mental Model</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">{scenario.feedbackMentalModel}</p>
              </div>
              
              {/* Startup Application */}
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-accent" />
                  <h4 className="text-caption font-semibold text-accent">For Your Startup</h4>
                </div>
                <p className="text-body text-text-muted italic leading-relaxed">{scenario.followUpQuestion}</p>
              </div>
            </div>
            
            {/* AI Mentor Chat - Emphasized */}
            {onAskMentor && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-4 rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-caption font-semibold text-accent mb-1">Want to understand why?</p>
                    <p className="text-caption text-text-secondary leading-relaxed">
                      Chat with Sophia to explore the reasoning behind this scenario and how it applies to your startup journey.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="default" 
                  size="default" 
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  onClick={() => onAskMentor(scenario.followUpQuestion)}
                >
                  <MessageCircle size={18} />
                  Chat with Sophia
                </Button>
              </motion.div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="default" className="flex-1" onClick={onSaveToNotebook}>
                <Bookmark size={18} />
                Save
              </Button>
              <Button variant="cta" size="default" className="flex-1" onClick={onNext}>
                Next
                <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Why This Scenario Popup */}
      <AnimatePresence>
        {showWhyPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
            onClick={() => setShowWhyPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-bg-1 rounded-2xl p-5 border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <HelpCircle size={16} className="text-accent" />
                  </div>
                  <h3 className="text-h3 text-text-primary">Why This Scenario?</h3>
                </div>
                <button
                  onClick={() => setShowWhyPopup(false)}
                  className="p-1 rounded-lg hover:bg-bg-2"
                >
                  <X size={18} className="text-text-muted" />
                </button>
              </div>
              
              <p className="text-body text-text-secondary leading-relaxed mb-4">
                {whyExplanation}
              </p>
              
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-caption text-accent font-medium mb-1">💡 Learning Objective</p>
                <p className="text-caption text-text-muted">
                  Build pattern recognition for industry-specific situations that separate successful founders from those who struggle.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
