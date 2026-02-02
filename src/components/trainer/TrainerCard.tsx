import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Bookmark, ArrowRight, MessageCircle, AlertTriangle, Brain, TrendingUp, Briefcase, HelpCircle, X, Sparkles } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { truncateOption } from "@/lib/text-utils";

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
  onAttemptComplete?: (isCorrect: boolean, selectedOption: number) => Promise<ServerFeedback | undefined>;
  marketId?: string;
}

interface ServerFeedback {
  isCorrect: boolean;
  correctIndex: number;
  feedback_pro_reasoning: string | null;
  feedback_common_mistake: string | null;
  feedback_mental_model: string | null;
  follow_up_question: string | null;
}

type EvaluationLevel = "strong" | "needs-work" | "off-track";

// Industry-specific context mapping
const industryContext: Record<string, { name: string; focus: string; transferMessage: string }> = {
  aerospace: { name: "aerospace", focus: "regulatory strategy, certification timelines, and supply chain dynamics", transferMessage: "aerospace business contexts" },
  neuroscience: { name: "neuroscience", focus: "FDA pathways, clinical trial design, and neurotech commercialization", transferMessage: "neurotech and biotech ventures" },
  biotech: { name: "biotech", focus: "drug development timelines, regulatory submissions, and clinical endpoints", transferMessage: "life sciences business decisions" },
  ai: { name: "AI", focus: "model deployment, data strategies, and enterprise sales cycles", transferMessage: "AI and machine learning ventures" },
  fintech: { name: "fintech", focus: "regulatory compliance, banking partnerships, and payment infrastructure", transferMessage: "financial technology business" },
  ev: { name: "EV", focus: "battery technology, charging infrastructure, and automotive partnerships", transferMessage: "electric mobility ventures" },
  cleanenergy: { name: "clean energy", focus: "project financing, grid integration, and regulatory incentives", transferMessage: "renewable energy business" },
  healthtech: { name: "healthtech", focus: "FDA pathways, hospital procurement, and clinical validation", transferMessage: "healthcare technology ventures" },
  cybersecurity: { name: "cybersecurity", focus: "enterprise sales, compliance requirements, and threat landscapes", transferMessage: "security technology decisions" },
  robotics: { name: "robotics", focus: "manufacturing partnerships, safety certifications, and automation ROI", transferMessage: "robotics and automation ventures" },
  spacetech: { name: "space tech", focus: "launch economics, satellite operations, and government contracts", transferMessage: "space industry decisions" },
  agtech: { name: "agtech", focus: "agricultural cycles, farmer economics, and supply chain logistics", transferMessage: "agricultural technology ventures" },
  climatetech: { name: "climate tech", focus: "carbon markets, policy incentives, and impact measurement", transferMessage: "climate and sustainability ventures" },
  logistics: { name: "logistics", focus: "supply chain optimization, last-mile economics, and fleet management", transferMessage: "logistics technology decisions" },
  web3: { name: "Web3", focus: "token economics, regulatory frameworks, and decentralization tradeoffs", transferMessage: "blockchain and crypto ventures" },
};

// Generate contextual "why this scenario" explanations based on market
function getWhyThisScenario(scenario: string, question: string, marketId?: string): string {
  const text = `${scenario} ${question}`.toLowerCase();
  const industry = industryContext[marketId || "aerospace"] || industryContext.aerospace;
  
  if (text.includes("buyer") || text.includes("procurement") || text.includes("purchase") || text.includes("sales")) {
    return `Understanding buyer psychology is crucial in ${industry.name}. This scenario teaches you to navigate complex purchasing decisions where technical champions rarely control budgets.`;
  }
  if (text.includes("certification") || text.includes("fda") || text.includes("regulatory") || text.includes("compliance")) {
    return `Regulatory strategy is a major barrier to ${industry.name} market entry. Founders who master compliance save years of delays and millions in development costs.`;
  }
  if (text.includes("supply") || text.includes("tier") || text.includes("oem") || text.includes("partnership")) {
    return `Strategic partnerships and supply chain positioning determine your pricing power, sales cycles, and growth trajectory in ${industry.name}.`;
  }
  if (text.includes("vc") || text.includes("investor") || text.includes("fundrais") || text.includes("funding") || text.includes("series")) {
    return `Investors in ${industry.name} evaluate differently than generalist VCs. Understanding their criteria—risk profiles, timelines, and market sizing—is essential for fundraising.`;
  }
  if (text.includes("defense") || text.includes("government") || text.includes("contract") || text.includes("grant")) {
    return `Government and enterprise contracts can provide stable revenue but come with unique compliance requirements. This scenario prepares you for navigating these opportunities in ${industry.name}.`;
  }
  if (text.includes("clinical") || text.includes("trial") || text.includes("patient") || text.includes("study")) {
    return `Clinical evidence and trial design are critical for ${industry.name} products. This scenario builds your understanding of validation pathways and study endpoints.`;
  }
  if (text.includes("competitor") || text.includes("market share") || text.includes("competitive")) {
    return `Competitive dynamics in ${industry.name} require strategic thinking about differentiation, timing, and market positioning.`;
  }
  
  return `This scenario develops pattern recognition for common ${industry.name} situations. The mental models here transfer across many ${industry.transferMessage}.`;
}

export function TrainerCard({ scenario, onSaveToNotebook, onNext, onAskMentor, onAttemptComplete, marketId }: TrainerCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationLevel | null>(null);
  const [showWhyPopup, setShowWhyPopup] = useState(false);
  const [serverFeedback, setServerFeedback] = useState<ServerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { play } = useSoundEffects();
  
  // Reset state when scenario changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowFeedback(false);
    setEvaluation(null);
    setServerFeedback(null);
    setIsSubmitting(false);
  }, [scenario.question]); // Use question as key since it's unique per scenario
  
  const whyExplanation = scenario.whyThisScenario || getWhyThisScenario(scenario.scenario, scenario.question, marketId);
  
  const handleOptionSelect = async (index: number) => {
    if (showFeedback || isSubmitting) return;
    
    setSelectedIndex(index);
    setIsSubmitting(true);
    
    try {
      // Submit to server and get feedback
      const feedback = await onAttemptComplete?.(false, index); // isCorrect is determined by server
      
      if (feedback) {
        setServerFeedback(feedback);
        setEvaluation(feedback.isCorrect ? "strong" : "needs-work");
        
        // Play sound based on result
        play(feedback.isCorrect ? "correct" : "incorrect");
        
        // Update the options with correct answer from server
        scenario.options.forEach((opt, i) => {
          opt.isCorrect = i === feedback.correctIndex;
        });
      } else {
        // Fallback if no server response (shouldn't happen)
        setEvaluation("needs-work");
        play("incorrect");
      }
      
      setTimeout(() => {
        setShowFeedback(true);
      }, 300);
    } catch (error) {
      console.error("Error submitting answer:", error);
      setEvaluation("off-track");
      setShowFeedback(true);
    } finally {
      setIsSubmitting(false);
    }
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
          const isCorrectOption = serverFeedback ? index === serverFeedback.correctIndex : false;
          
          let optionStyle = "";
          if (showFeedback && isSelected) {
            optionStyle = isCorrectOption ? "border-green-500 bg-green-500/10" : "border-amber-500 bg-amber-500/10";
          } else if (showFeedback && isCorrectOption) {
            optionStyle = "border-green-500/50";
          } else if (isSelected) {
            optionStyle = "border-primary";
          } else if (isSubmitting) {
            optionStyle = "opacity-50";
          }
          
          return (
            <motion.button
              key={index}
            whileTap={!showFeedback && !isSubmitting ? { scale: 0.98 } : undefined}
            onClick={() => handleOptionSelect(index)}
            disabled={showFeedback || isSubmitting}
              className={`w-full p-4 rounded-card border text-left transition-all no-select ${
                optionStyle || "border-border bg-bg-2 hover:border-text-muted"
              }`}
            >
              <span className="text-body text-text-primary">{truncateOption(option.label, 120)}</span>
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
                <p className="text-body text-text-secondary leading-relaxed">
                  {serverFeedback?.feedback_pro_reasoning || scenario.feedbackProReasoning || "No feedback available."}
                </p>
              </div>
              
              {/* Common Mistake */}
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h4 className="text-caption font-semibold text-amber-400">Common Mistake</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">
                  {serverFeedback?.feedback_common_mistake || scenario.feedbackCommonMistake || "No feedback available."}
                </p>
              </div>
              
              {/* Mental Model */}
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-blue-400" />
                  <h4 className="text-caption font-semibold text-blue-400">Mental Model</h4>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">
                  {serverFeedback?.feedback_mental_model || scenario.feedbackMentalModel || "No feedback available."}
                </p>
              </div>
              
              {/* Startup Application */}
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-accent" />
                  <h4 className="text-caption font-semibold text-accent">For Your Startup</h4>
                </div>
                <p className="text-body text-text-muted italic leading-relaxed">
                  {serverFeedback?.follow_up_question || scenario.followUpQuestion || "Consider how this applies to your startup."}
                </p>
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
                  onClick={() => onAskMentor(serverFeedback?.follow_up_question || scenario.followUpQuestion)}
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
