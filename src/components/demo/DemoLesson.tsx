import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Zap, CheckCircle2, XCircle, Star, Lock, Trophy, Brain, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import mentorMaya from "@/assets/mentors/mentor-maya.png";

// ─── Demo Content: AI Market ─────────────────────────────────────────────────
const DEMO_SLIDES = [
  {
    id: 1,
    title: "The $1 Trillion AI Infrastructure Race",
    body: `The AI industry isn't just about models — it's an arms race for compute infrastructure. Between 2022 and 2024, the three hyperscalers (AWS, Azure, GCP) collectively spent over $200 billion on data centers, GPUs, and networking equipment.

NVIDIA's H100 GPU — the "gold standard" for AI training — commands $30,000–$40,000 per chip, and demand still outpaces supply by 10x. This created a secondary market where startups pay 2–3x for spot capacity.

The real moat isn't the model. It's whoever owns the inference infrastructure at scale.`,
    insight: "Compute is the new oil. The company that owns the pipes often wins more than the company that owns the algorithm.",
  },
  {
    id: 2,
    title: "Why 90% of 'AI Companies' Aren't Really AI Companies",
    body: `Most companies calling themselves "AI companies" are actually software companies with an OpenAI API key. The distinction matters enormously for investors and job-seekers.

True AI companies (Anthropic, Mistral, xAI) invest $100M+ in model training and research. "AI-native" companies (Cursor, Perplexity, Harvey) build specialized UX on foundation models. "AI-integrated" incumbents (Salesforce, Adobe) are adding AI features to existing products.

Each category has fundamentally different moats, burn rates, and hiring profiles. Confusing them is the most common mistake in AI market analysis.`,
    insight: "When evaluating an AI opportunity, always ask: where exactly in the stack does their edge come from?",
  },
];

const DEMO_QUIZ = {
  question: "A Series A startup claims it has a proprietary AI model. Upon digging in, you find they fine-tuned GPT-4 on their internal data. How should you classify this company?",
  scenario: "You're evaluating an investment in NovaMind AI, which has raised $8M and claims to have a 'proprietary large language model' for legal document analysis. Their CTO confirms they fine-tuned OpenAI's GPT-4 on 2M legal documents. They have 45 paying law firm customers.",
  options: [
    { text: "True AI Company — fine-tuning IS model development", correct: false, feedback: "Fine-tuning modifies a model's behavior, but doesn't constitute building foundational AI. The underlying architecture, training compute, and core IP still belong to OpenAI." },
    { text: "AI-Native Company — specialized UX and data moat on top of foundation models", correct: true, feedback: "Correct. Their edge comes from domain-specific data (2M legal docs) and specialized UX — not the model itself. This is a valid and valuable moat, just categorized correctly." },
    { text: "AI-Integrated Incumbent — legacy software with AI features bolted on", correct: false, feedback: "Incumbents are established companies adding AI to existing products. NovaMind is a new company built AI-first — they're AI-native, not AI-integrated." },
    { text: "Undifferentiated — no moat at all if anyone can fine-tune GPT-4", correct: false, feedback: "The data moat (2M curated legal documents + 45 paying customers) is a real competitive advantage. Any company can try to fine-tune, but replicating proprietary training data takes years." },
  ],
};

const DEMO_TRAINER = {
  scenario: "You're advising a $50M growth-stage VC fund. A portfolio company (Series B, AI-powered sales tool) just hit 3x revenue growth but needs $20M to scale. Their burn rate is 18 months runway. Two term sheets arrived: (A) $20M at 8x ARR — existing investor led, clean terms. (B) $25M at 10x ARR — new strategic investor, but they want 1 board seat + anti-dilution ratchet.",
  question: "What's the primary risk to flag for the founders before they decide?",
  options: [
    { text: "Term Sheet B's valuation is inflated — 10x ARR is unsustainable", correct: false, feedback: "Valuation alone isn't the red flag here. 10x ARR at 3x growth is aggressive but defensible in AI infrastructure plays. The structure is the issue." },
    { text: "The anti-dilution ratchet in Term Sheet B can severely punish founders in a down round", correct: true, feedback: "Exactly. Anti-dilution ratchets (especially full-ratchet) can be catastrophic if the next round prices lower. Founders and early employees could see massive dilution even if the company is performing." },
    { text: "18 months runway is too short — they should delay the raise", correct: false, feedback: "18 months is actually healthy runway. The timing is fine — raising proactively from strength is good practice. The structure of the deal is the priority concern." },
    { text: "The strategic investor's board seat gives them operational control", correct: false, feedback: "One board seat is typically minority influence, not control. Unless it comes with special voting rights (not mentioned), one seat is standard for a lead investor at this stage." },
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────
type DemoStep = "intro" | "slide1" | "slide2" | "quiz" | "quiz-result" | "trainer" | "trainer-result" | "gate";

interface DemoLessonProps {
  onSignUp: () => void;
  onClose: () => void;
}

// ─── XP Particle Component ────────────────────────────────────────────────────
function XPBurst({ amount, show }: { amount: number; show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.5, 1.2, 1, 0.8] }}
      transition={{ duration: 1.4, ease: "easeOut" }}
      className="absolute top-0 right-0 pointer-events-none z-50"
    >
      <div className="flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full px-3 py-1">
        <Zap size={14} className="text-yellow-400" />
        <span className="text-yellow-400 font-bold text-sm">+{amount} XP</span>
      </div>
    </motion.div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function DemoProgress({ step }: { step: DemoStep }) {
  const steps: DemoStep[] = ["intro", "slide1", "slide2", "quiz", "trainer", "gate"];
  const currentIdx = steps.indexOf(step.replace("-result", "") as DemoStep);
  const progress = Math.min(((currentIdx) / (steps.length - 1)) * 100, 95);

  return (
    <div className="w-full h-1.5 bg-bg-1 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-accent to-purple-400 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DEMO_SEEN_KEY = "ml_demo_seen";

export function DemoLesson({ onSignUp, onClose }: DemoLessonProps) {
  const [step, setStep] = useState<DemoStep>("intro");

  // Mark demo as seen as soon as user opens it
  useEffect(() => {
    localStorage.setItem(DEMO_SEEN_KEY, "true");
  }, []);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [trainerOption, setTrainerOption] = useState<number | null>(null);
  const [xpTotal, setXpTotal] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const awardXP = (amount: number) => {
    setXpAmount(amount);
    setShowXP(true);
    setXpTotal(prev => prev + amount);
    setTimeout(() => setShowXP(false), 1500);
  };

  const handleQuizAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (DEMO_QUIZ.options[idx].correct) {
      awardXP(15);
    } else {
      awardXP(5);
    }
    setTimeout(() => setStep("quiz-result"), 1800);
  };

  const handleTrainerAnswer = (idx: number) => {
    if (trainerOption !== null) return;
    setTrainerOption(idx);
    if (DEMO_TRAINER.options[idx].correct) {
      awardXP(25);
    } else {
      awardXP(8);
    }
    setTimeout(() => setStep("trainer-result"), 1800);
  };

  const slideVariants = {
    enter: { x: "100%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-bg-0 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe-top pt-4 pb-3 flex items-center justify-between gap-3 border-b border-border">
        <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors">
          <X size={20} />
        </button>

        <div className="flex-1">
          <DemoProgress step={step} />
        </div>

        {/* XP Counter */}
        <div className="relative flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-sm">{xpTotal} XP</span>
          <XPBurst amount={xpAmount} show={showXP} />
        </div>
      </div>

      {/* Mentor strip */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-bg-1/60 border-b border-border/50">
        <img src={mentorMaya} alt="Maya" className="w-8 h-8 rounded-full object-cover object-[50%_20%] border border-accent/30" />
        <div>
          <p className="text-[11px] text-accent font-semibold">Maya Chen · AI Market Strategist</p>
          <p className="text-[11px] text-text-muted">Free sample lesson · AI Industry</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[11px] text-text-muted">
          <Star size={11} className="text-yellow-400" />
          <span>4.9</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* ── INTRO ── */}
          {step === "intro" && (
            <motion.div key="intro" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30"
              >
                <Brain size={40} className="text-white" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="chip mb-4 text-accent border-accent/30">🤖 AI Industry · Day 1</div>
                <h1 className="text-h1 text-text-primary mb-3">The AI Market Crash Course</h1>
                <p className="text-body text-text-secondary max-w-xs mx-auto mb-2">
                  In 4 minutes, you'll learn to think like an AI market analyst — and make better decisions because of it.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full max-w-sm space-y-2.5 mb-8 mt-6"
              >
                {[
                  { icon: "📖", label: "2 insider slides" },
                  { icon: "🧠", label: "1 real market quiz" },
                  { icon: "💼", label: "1 investor scenario" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-bg-2 rounded-xl px-4 py-3 border border-border">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-body text-text-secondary">{item.label}</span>
                    <div className="ml-auto flex items-center gap-1 text-yellow-400">
                      <Zap size={12} />
                      <span className="text-xs font-bold">+XP</span>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-sm"
              >
                <Button variant="cta" size="full" onClick={() => setStep("slide1")}>
                  Start Free Lesson <ChevronRight size={18} />
                </Button>
                <p className="text-caption text-text-muted text-center mt-3">No signup required · 4 min read</p>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 1 ── */}
          {step === "slide1" && (
            <motion.div key="slide1" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 overflow-y-auto px-4 py-5"
            >
              <div className="max-w-lg mx-auto space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="chip bg-blue-500/20 text-blue-400 border-blue-500/30">Slide 1 of 2</span>
                  <span className="text-caption text-text-muted">2 min read</span>
                </div>

                <h2 className="text-h2 text-text-primary">{DEMO_SLIDES[0].title}</h2>

                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-blue-400" />
                    <span className="text-caption text-blue-400 font-semibold">KEY MARKET DATA</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "$200B+", label: "Hyperscaler capex 2022–24" },
                      { value: "10x", label: "H100 GPU demand vs. supply" },
                      { value: "$30–40K", label: "Cost per H100 chip" },
                    ].map((stat, i) => (
                      <div key={i} className="text-center">
                        <p className="text-h3 text-blue-300 font-bold">{stat.value}</p>
                        <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated">
                  <p className="text-body text-text-secondary leading-relaxed whitespace-pre-line">
                    {DEMO_SLIDES[0].body}
                  </p>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex gap-3">
                  <img src={mentorMaya} alt="Maya" className="w-9 h-9 rounded-full object-cover object-[50%_20%] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-caption text-accent font-semibold mb-1">Maya's Insight</p>
                    <p className="text-caption text-text-secondary italic">"{DEMO_SLIDES[0].insight}"</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 left-0 right-0 pt-4 pb-6 px-4 bg-gradient-to-t from-bg-0 to-transparent">
                <Button variant="cta" size="full" onClick={() => { setStep("slide2"); awardXP(10); }}>
                  Next Slide <ChevronRight size={18} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── SLIDE 2 ── */}
          {step === "slide2" && (
            <motion.div key="slide2" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 overflow-y-auto px-4 py-5"
            >
              <div className="max-w-lg mx-auto space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="chip bg-purple-500/20 text-purple-400 border-purple-500/30">Slide 2 of 2</span>
                  <span className="text-caption text-text-muted">2 min read</span>
                </div>

                <h2 className="text-h2 text-text-primary">{DEMO_SLIDES[1].title}</h2>

                {/* Category breakdown */}
                <div className="space-y-2">
                  {[
                    { label: "True AI Companies", example: "Anthropic, Mistral, xAI", color: "from-purple-500 to-indigo-500", note: "$100M+ in training" },
                    { label: "AI-Native Companies", example: "Cursor, Perplexity, Harvey", color: "from-blue-500 to-cyan-500", note: "Specialized UX on foundation models" },
                    { label: "AI-Integrated Incumbents", example: "Salesforce, Adobe", color: "from-green-500 to-teal-500", note: "AI features on existing products" },
                  ].map((cat, i) => (
                    <div key={i} className="flex items-center gap-3 bg-bg-2 rounded-xl p-3 border border-border">
                      <div className={`w-2 h-10 rounded-full bg-gradient-to-b ${cat.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-caption text-text-primary font-semibold">{cat.label}</p>
                        <p className="text-[11px] text-text-muted truncate">{cat.example}</p>
                      </div>
                      <span className="text-[10px] text-text-muted text-right max-w-[80px] leading-tight">{cat.note}</span>
                    </div>
                  ))}
                </div>

                <div className="card-elevated">
                  <p className="text-body text-text-secondary leading-relaxed whitespace-pre-line">
                    {DEMO_SLIDES[1].body}
                  </p>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex gap-3">
                  <img src={mentorMaya} alt="Maya" className="w-9 h-9 rounded-full object-cover object-[50%_20%] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-caption text-accent font-semibold mb-1">Maya's Insight</p>
                    <p className="text-caption text-text-secondary italic">"{DEMO_SLIDES[1].insight}"</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 left-0 right-0 pt-4 pb-6 px-4 bg-gradient-to-t from-bg-0 to-transparent">
                <Button variant="cta" size="full" onClick={() => { setStep("quiz"); awardXP(10); }}>
                  Test Your Knowledge <ChevronRight size={18} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {step === "quiz" && (
            <motion.div key="quiz" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 overflow-y-auto px-4 py-5"
            >
              <div className="max-w-lg mx-auto space-y-4">
                <div className="flex items-center gap-2">
                  <span className="chip bg-green-500/20 text-green-400 border-green-500/30">🧠 Market Quiz</span>
                </div>

                <div className="bg-bg-2 rounded-2xl p-4 border border-border">
                  <p className="text-caption text-text-muted mb-3 leading-relaxed">{DEMO_QUIZ.scenario}</p>
                  <h3 className="text-h3 text-text-primary">{DEMO_QUIZ.question}</h3>
                </div>

                <div className="space-y-2.5">
                  {DEMO_QUIZ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = option.correct;
                    const hasAnswered = selectedOption !== null;

                    let borderColor = "border-border";
                    let bgColor = "bg-bg-2";
                    let textColor = "text-text-primary";

                    if (hasAnswered) {
                      if (isCorrect) { borderColor = "border-green-500"; bgColor = "bg-green-500/10"; }
                      else if (isSelected && !isCorrect) { borderColor = "border-red-500"; bgColor = "bg-red-500/10"; }
                      else { bgColor = "bg-bg-1"; textColor = "text-text-muted"; }
                    }

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        disabled={hasAnswered}
                        whileHover={!hasAnswered ? { scale: 1.01 } : {}}
                        whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                        className={`w-full text-left rounded-xl border p-4 transition-all ${borderColor} ${bgColor}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            hasAnswered && isCorrect ? "bg-green-500 border-green-500" :
                            hasAnswered && isSelected && !isCorrect ? "bg-red-500 border-red-500" :
                            "border-border"
                          }`}>
                            {hasAnswered && isCorrect && <CheckCircle2 size={14} className="text-white" />}
                            {hasAnswered && isSelected && !isCorrect && <XCircle size={14} className="text-white" />}
                            {(!hasAnswered || (!isCorrect && !isSelected)) && (
                              <span className="text-[11px] text-text-muted font-bold">{String.fromCharCode(65 + idx)}</span>
                            )}
                          </div>
                          <div>
                            <p className={`text-body font-medium ${textColor}`}>{option.text}</p>
                            {hasAnswered && (isCorrect || isSelected) && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-caption text-text-secondary mt-2 leading-relaxed"
                              >
                                {option.feedback}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── QUIZ RESULT ── */}
          {step === "quiz-result" && (
            <motion.div key="quiz-result" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              {DEMO_QUIZ.options[selectedOption!]?.correct ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-5">
                    <CheckCircle2 size={40} className="text-green-400" />
                  </motion.div>
                  <h2 className="text-h2 text-text-primary mb-2">Sharp thinking! 🎯</h2>
                  <p className="text-body text-text-secondary mb-2">You correctly identified the AI-native classification. Maya would be proud.</p>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mb-5">
                    <Brain size={40} className="text-amber-400" />
                  </motion.div>
                  <h2 className="text-h2 text-text-primary mb-2">Great insight attempt!</h2>
                  <p className="text-body text-text-secondary mb-2">This is a nuanced distinction. Re-read the feedback — it's the kind of thing that separates analysts from novices.</p>
                </>
              )}

              <div className="bg-bg-2 rounded-xl px-5 py-3 border border-border mb-8">
                <p className="text-caption text-text-muted">Total XP earned</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Zap size={18} className="text-yellow-400" />
                  <span className="text-h2 text-yellow-400 font-bold">{xpTotal}</span>
                </div>
              </div>

              <Button variant="cta" size="full" className="max-w-sm" onClick={() => setStep("trainer")}>
                Final Challenge: Investor Scenario <ChevronRight size={18} />
              </Button>
            </motion.div>
          )}

          {/* ── TRAINER ── */}
          {step === "trainer" && (
            <motion.div key="trainer" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 overflow-y-auto px-4 py-5"
            >
              <div className="max-w-lg mx-auto space-y-4">
                <div className="flex items-center gap-2">
                  <span className="chip bg-orange-500/20 text-orange-400 border-orange-500/30">💼 Investor Scenario</span>
                  <span className="text-caption text-text-muted">Expert level</span>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-4">
                  <p className="text-caption text-text-muted leading-relaxed">{DEMO_TRAINER.scenario}</p>
                </div>

                <h3 className="text-h3 text-text-primary">{DEMO_TRAINER.question}</h3>

                <div className="space-y-2.5">
                  {DEMO_TRAINER.options.map((option, idx) => {
                    const isSelected = trainerOption === idx;
                    const isCorrect = option.correct;
                    const hasAnswered = trainerOption !== null;

                    let borderColor = "border-border";
                    let bgColor = "bg-bg-2";
                    let textColor = "text-text-primary";

                    if (hasAnswered) {
                      if (isCorrect) { borderColor = "border-green-500"; bgColor = "bg-green-500/10"; }
                      else if (isSelected && !isCorrect) { borderColor = "border-red-500"; bgColor = "bg-red-500/10"; }
                      else { bgColor = "bg-bg-1"; textColor = "text-text-muted"; }
                    }

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleTrainerAnswer(idx)}
                        disabled={hasAnswered}
                        whileHover={!hasAnswered ? { scale: 1.01 } : {}}
                        whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                        className={`w-full text-left rounded-xl border p-4 transition-all ${borderColor} ${bgColor}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            hasAnswered && isCorrect ? "bg-green-500 border-green-500" :
                            hasAnswered && isSelected && !isCorrect ? "bg-red-500 border-red-500" :
                            "border-border"
                          }`}>
                            {hasAnswered && isCorrect && <CheckCircle2 size={14} className="text-white" />}
                            {hasAnswered && isSelected && !isCorrect && <XCircle size={14} className="text-white" />}
                            {(!hasAnswered || (!isCorrect && !isSelected)) && (
                              <span className="text-[11px] text-text-muted font-bold">{String.fromCharCode(65 + idx)}</span>
                            )}
                          </div>
                          <div>
                            <p className={`text-body font-medium ${textColor}`}>{option.text}</p>
                            {hasAnswered && (isCorrect || isSelected) && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-caption text-text-secondary mt-2 leading-relaxed"
                              >
                                {option.feedback}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TRAINER RESULT / GATE ── */}
          {step === "trainer-result" && (
            <motion.div key="trainer-result" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              {DEMO_TRAINER.options[trainerOption!]?.correct ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                    <Trophy size={38} className="text-green-400" />
                  </motion.div>
                  <h2 className="text-h2 text-text-primary mb-2">Investor-grade thinking! 🏆</h2>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center mb-4">
                    <Brain size={38} className="text-purple-400" />
                  </motion.div>
                  <h2 className="text-h2 text-text-primary mb-2">You're getting there!</h2>
                </>
              )}

              <p className="text-body text-text-secondary mb-6 max-w-xs">
                The anti-dilution trap catches most first-time founders. You now know to look for it.
              </p>

              <Button variant="cta" size="full" className="max-w-sm" onClick={() => setStep("gate")}>
                See Your Results <ChevronRight size={18} />
              </Button>
            </motion.div>
          )}

          {/* ── GATE / SIGNUP PROMPT ── */}
          {step === "gate" && (
            <motion.div key="gate" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-0 overflow-y-auto flex flex-col items-center justify-center px-6 text-center py-8"
            >
              {/* Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div key={i}
                    className={`absolute w-2 h-2 rounded-full ${["bg-yellow-400", "bg-pink-400", "bg-purple-400", "bg-cyan-400", "bg-green-400"][i % 5]}`}
                    initial={{ x: "50vw", y: "50vh", scale: 0 }}
                    animate={{ x: `${Math.random() * 100}vw`, y: `${Math.random() * 80}vh`, scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                    transition={{ duration: 2.5, delay: i * 0.07, ease: "easeOut" }}
                  />
                ))}
              </div>

              {/* Score card */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 16, stiffness: 200 }}
                className="w-full max-w-sm bg-gradient-to-br from-bg-2 to-bg-1 rounded-3xl p-6 border border-border shadow-2xl mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Trophy size={20} className="text-yellow-400" />
                  <span className="text-caption text-yellow-400 font-bold uppercase tracking-wider">Session Complete</span>
                </div>

                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <span className="text-[56px] font-black text-yellow-400 leading-none">{xpTotal}</span>
                  <span className="text-h3 text-text-muted">XP</span>
                </div>
                <p className="text-caption text-text-muted mb-5">earned this session</p>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Slides read", value: "2", icon: "📖" },
                    { label: "Quiz score", value: DEMO_QUIZ.options[selectedOption!]?.correct ? "✓" : "~", icon: "🧠" },
                    { label: "Scenario", value: DEMO_TRAINER.options[trainerOption!]?.correct ? "✓" : "~", icon: "💼" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-bg-0/60 rounded-xl p-2.5 border border-border">
                      <p className="text-lg mb-0.5">{stat.icon}</p>
                      <p className="text-h3 text-text-primary">{stat.value}</p>
                      <p className="text-[10px] text-text-muted leading-tight">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Locked content teaser */}
                <div className="bg-bg-0/80 rounded-xl p-3 border border-border/50 flex items-center gap-3">
                  <Lock size={16} className="text-text-muted flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-caption text-text-primary font-medium">179 more days waiting</p>
                    <p className="text-[11px] text-text-muted">AI Market full curriculum + 14 other industries</p>
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <div className="w-full max-w-sm space-y-3">
                <Button variant="cta" size="full" onClick={onSignUp} className="text-base font-bold">
                  <Zap size={18} />
                  Save Progress & Start for Free
                </Button>
                <p className="text-caption text-text-muted">
                  Free forever · No credit card · Choose any of 15 industries
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
