import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TrainerCard } from "@/components/trainer/TrainerCard";
import { toast } from "sonner";

const mockScenario = {
  scenario:
    "A well-funded AI startup has built a successful code completion tool with 100K developers using it daily. OpenAI just announced a competing feature that integrates directly into VS Code. The startup has 18 months of runway and 50 employees.",
  question: "What should the startup prioritize in the next 90 days?",
  options: [
    { label: "Double down on marketing to acquire users before OpenAI's feature launches", isCorrect: false },
    { label: "Pivot to enterprise sales where integration depth matters more than brand", isCorrect: true },
    { label: "Raise an emergency bridge round to extend runway and weather the storm", isCorrect: false },
    { label: "Open-source the product to build community moat against closed alternatives", isCorrect: false },
  ],
  feedbackProReasoning:
    "Enterprise deals provide revenue stability and switching costs that consumer products lack. When a platform player enters your market, the race to commoditization accelerates for consumer products. Enterprise customers value integration depth, compliance, and support—areas where startups can differentiate.",
  feedbackCommonMistake: "Trying to out-market a platform player with 100x your resources.",
  feedbackMentalModel: "Distribution beats product when platforms compete. Find defensible niches.",
  followUpQuestion: "What specific enterprise verticals would be most defensible against OpenAI?",
};

export default function TrainerPage() {
  const navigate = useNavigate();
  const [currentScenario, setCurrentScenario] = useState(mockScenario);

  const handleSaveToNotebook = () => {
    toast.success("Saved to notebook!");
  };

  const handleNext = () => {
    toast.success("Loading next scenario...");
    // In real app, fetch next scenario
  };

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
        <h1 className="text-h2 text-text-primary">Trainer</h1>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 screen-padding py-6 overflow-auto"
      >
        <TrainerCard
          scenario={currentScenario}
          onSaveToNotebook={handleSaveToNotebook}
          onNext={handleNext}
        />
      </motion.div>
    </div>
  );
}
