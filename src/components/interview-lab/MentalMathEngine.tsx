import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";
import { Hash, Delete, Timer, CheckCircle, XCircle, Zap, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type MathOp = '+' | '-' | '×' | '÷' | '%';

interface BusinessMathQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const INDUSTRY_BUSINESS_MATH: Record<string, BusinessMathQ[]> = {
  aerospace: [
    { question: "A satellite constellation costs $3.2B to deploy. If 40% is launch costs, what's the launch budget?", options: ['$960M', '$1.28B', '$1.6B', '$2.08B'], correctIndex: 1, explanation: '$3.2B × 40% = $1.28B for launches.' },
    { question: "An airline's load factor improved from 72% to 84%. What's the percentage point increase?", options: ['12 pp', '16.7%', '12%', '8 pp'], correctIndex: 0, explanation: '84% − 72% = 12 percentage points.' },
    { question: "Boeing delivered 528 aircraft in 2023. If Airbus delivered 735, what's Boeing's market share?", options: ['42%', '58%', '72%', '38%'], correctIndex: 0, explanation: '528 / (528+735) ≈ 41.8%, rounds to 42%.' },
  ],
  fintech: [
    { question: "A neobank has 2M users with $5K avg deposits. What's total deposits?", options: ['$1B', '$10B', '$100B', '$500M'], correctIndex: 1, explanation: '2M × $5K = $10B in total deposits.' },
    { question: "Stock price dropped from $50 to $12. Calculate the % decline.", options: ['69%', '76%', '38%', '24%'], correctIndex: 1, explanation: '($50-$12)/$50 = 76% decline.' },
    { question: "If a payment processor handles $50B GMV at 2.5% take rate, what's revenue?", options: ['$125M', '$500M', '$1.25B', '$2.5B'], correctIndex: 2, explanation: '$50B × 2.5% = $1.25B revenue.' },
  ],
  biotech: [
    { question: "A drug trial costs $800M. Phase 3 is 60% of total cost. What's the Phase 3 budget?", options: ['$320M', '$480M', '$560M', '$640M'], correctIndex: 1, explanation: '$800M × 60% = $480M.' },
    { question: "If 10,000 patients are screened and 15% qualify, how many enter the trial?", options: ['1,000', '1,500', '2,000', '850'], correctIndex: 1, explanation: '10,000 × 15% = 1,500 patients.' },
  ],
  ai: [
    { question: "Training a large language model costs $4.6M. If compute is 78% of cost, what's the compute spend?", options: ['$2.9M', '$3.6M', '$4.1M', '$1.7M'], correctIndex: 1, explanation: '$4.6M × 78% ≈ $3.59M.' },
    { question: "An AI startup has 340 enterprise clients paying $120K/year ARR. What's total ARR?", options: ['$40.8M', '$28.4M', '$34M', '$51M'], correctIndex: 0, explanation: '340 × $120K = $40.8M ARR.' },
  ],
};

const DEFAULT_BUSINESS_MATH: BusinessMathQ[] = [
  { question: "A company's revenue grew from $80M to $120M. What's the growth rate?", options: ['33%', '40%', '50%', '66%'], correctIndex: 2, explanation: '($120M-$80M)/$80M = 50% growth.' },
  { question: "If a product has 35% gross margin on $2M revenue, what's gross profit?", options: ['$500K', '$700K', '$1.3M', '$650K'], correctIndex: 1, explanation: '$2M × 35% = $700K gross profit.' },
  { question: "A stock price dropped from $50 to $12. Calculate the % decline.", options: ['69%', '76%', '62%', '84%'], correctIndex: 1, explanation: '($50-$12)/$50 = 76% decline.' },
  { question: "Market is $45B. Company has 8% share. What's their revenue?", options: ['$3.6B', '$4.5B', '$2.4B', '$5.6B'], correctIndex: 0, explanation: '$45B × 8% = $3.6B.' },
];

function generateArithmeticQ(op: MathOp): { question: string; answer: number } {
  let a: number, b: number, answer: number;
  switch (op) {
    case '+': a = Math.floor(Math.random() * 900) + 100; b = Math.floor(Math.random() * 900) + 100; answer = a + b; return { question: `${a} + ${b}`, answer };
    case '-': a = Math.floor(Math.random() * 900) + 200; b = Math.floor(Math.random() * (a - 50)) + 50; answer = a - b; return { question: `${a} − ${b}`, answer };
    case '×': a = Math.floor(Math.random() * 90) + 10; b = Math.floor(Math.random() * 9) + 2; answer = a * b; return { question: `${a} × ${b}`, answer };
    case '÷': b = Math.floor(Math.random() * 9) + 2; answer = Math.floor(Math.random() * 90) + 10; a = b * answer; return { question: `${a} ÷ ${b}`, answer };
    case '%': b = Math.floor(Math.random() * 200) + 20; const pct = [10, 15, 20, 25, 30, 40, 50, 60, 75][Math.floor(Math.random() * 9)]; answer = Math.round(b * pct / 100); return { question: `${pct}% of ${b}`, answer };
    default: return { question: '1 + 1', answer: 2 };
  }
}

const OPS: { op: MathOp; icon: string; label: string }[] = [
  { op: '+', icon: '➕', label: 'Addition' },
  { op: '-', icon: '➖', label: 'Subtraction' },
  { op: '×', icon: '✖️', label: 'Multiplication' },
  { op: '÷', icon: '➗', label: 'Division' },
  { op: '%', icon: '🔢', label: 'Percentages' },
];

export function MentalMathEngine({ marketId }: { marketId: string }) {
  const [mode, setMode] = useState<'select' | 'arithmetic' | 'business'>('select');
  const [selectedOp, setSelectedOp] = useState<MathOp>('+');
  const [currentQ, setCurrentQ] = useState<{ question: string; answer: number } | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [timer, setTimer] = useState(60);
  const [running, setRunning] = useState(false);

  // Business math
  const [bizIndex, setBizIndex] = useState(0);
  const [bizSelected, setBizSelected] = useState<number | null>(null);
  const [bizTimer, setBizTimer] = useState(45);
  const [bizScore, setBizScore] = useState(0);

  const businessQs = INDUSTRY_BUSINESS_MATH[marketId] || DEFAULT_BUSINESS_MATH;

  // Arithmetic timer
  useEffect(() => {
    if (!running || timer <= 0) return;
    const t = setInterval(() => setTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [running, timer]);

  useEffect(() => {
    if (timer <= 0 && running) { setRunning(false); hapticFeedback("heavy"); }
  }, [timer, running]);

  // Business math timer
  useEffect(() => {
    if (mode !== 'business' || bizSelected !== null || bizTimer <= 0) return;
    const t = setInterval(() => setBizTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [mode, bizSelected, bizTimer]);

  const startArithmetic = (op: MathOp) => {
    setSelectedOp(op);
    setMode('arithmetic');
    setScore(0);
    setTotal(0);
    setTimer(60);
    setResult(null);
    setInput('');
    setCurrentQ(generateArithmeticQ(op));
    setRunning(true);
  };

  const handleKeyPress = (key: string) => {
    if (!running || result) return;
    hapticFeedback("light");
    if (key === 'DEL') setInput(v => v.slice(0, -1));
    else if (key === 'GO') checkAnswer();
    else if (key === '-' && input === '') setInput('-');
    else if (input.length < 8) setInput(v => v + key);
  };

  const checkAnswer = () => {
    if (!currentQ || !input) return;
    const userAns = parseFloat(input);
    const correct = userAns === currentQ.answer;
    setResult(correct ? 'correct' : 'wrong');
    setTotal(t => t + 1);
    if (correct) { setScore(s => s + 1); hapticFeedback("medium"); }
    else hapticFeedback("heavy");
    setTimeout(() => {
      setResult(null);
      setInput('');
      setCurrentQ(generateArithmeticQ(selectedOp));
    }, 1200);
  };

  // ─── Select Mode ───
  if (mode === 'select') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Hash size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Mental Math</h3>
            <p className="text-xs text-text-muted">Sharpen your quantitative skills</p>
          </div>
        </div>

        {/* Arithmetic Drills */}
        <div className="bg-bg-2 rounded-3xl p-5 border border-border">
          <p className="text-sm font-bold text-text-primary mb-1">🧮 Arithmetic Drills</p>
          <p className="text-xs text-text-muted mb-4">60 seconds. No calculator. Go.</p>
          <div className="grid grid-cols-3 gap-3">
            {OPS.map(o => (
              <button key={o.op} onClick={() => startArithmetic(o.op)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-bg-1 border border-border hover:border-primary/50 transition-all">
                <span className="text-2xl">{o.icon}</span>
                <span className="text-[11px] font-medium text-text-muted">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Business Math */}
        <button onClick={() => { setMode('business'); setBizIndex(0); setBizSelected(null); setBizTimer(45); setBizScore(0); }}
          className="w-full bg-bg-2 rounded-3xl p-5 border border-border text-left hover:border-primary/50 transition-all">
          <p className="text-sm font-bold text-text-primary mb-1">💼 Business Math</p>
          <p className="text-xs text-text-muted mb-3">Industry word problems with timer</p>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-[10px] font-bold text-primary">
              {businessQs.length} QUESTIONS
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-[10px] font-bold text-amber-500">
              45s TIMER
            </span>
          </div>
        </button>
      </div>
    );
  }

  // ─── Business Math Mode ───
  if (mode === 'business') {
    const q = businessQs[bizIndex];
    if (!q) return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🎉</p>
        <p className="text-xl font-bold text-text-primary mb-2">All Done!</p>
        <p className="text-sm text-text-muted mb-4">Score: {bizScore}/{businessQs.length}</p>
        <Button onClick={() => setMode('select')} variant="outline"><RotateCcw size={14} /> Back to Menu</Button>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('select')} className="text-sm text-text-muted">← Back</button>
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold", bizTimer <= 10 ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary")}>
            <Timer size={14} /> {bizTimer}s
          </div>
        </div>

        <p className="text-xs text-text-muted text-center">Question {bizIndex + 1} of {businessQs.length}</p>

        <div className="bg-bg-2 rounded-3xl p-5 border border-border">
          <div className="text-center mb-4">
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-sm font-semibold text-text-primary leading-relaxed mb-5">{q.question}</p>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const revealed = bizSelected !== null;
              const isCorrect = i === q.correctIndex;
              const isSelected = bizSelected === i;
              return (
                <button key={i} disabled={revealed}
                  onClick={() => {
                    setBizSelected(i);
                    if (isCorrect) { setBizScore(s => s + 1); hapticFeedback("medium"); }
                    else hapticFeedback("heavy");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                    !revealed && "border-border hover:border-amber-400",
                    revealed && isCorrect && "border-emerald-500 bg-emerald-500/5",
                    isSelected && !isCorrect && "border-red-500 bg-red-500/5",
                  )}>
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                    !revealed && "border-border",
                    revealed && isCorrect && "border-emerald-500 bg-emerald-500",
                    isSelected && !isCorrect && "border-red-500 bg-red-500",
                  )}>
                    {revealed && isCorrect && <CheckCircle size={12} className="text-white" />}
                    {isSelected && !isCorrect && <XCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-text-primary font-medium">{opt}</span>
                </button>
              );
            })}
          </div>

          {bizSelected !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-2xl bg-primary/5">
              <p className="text-xs text-text-secondary">{q.explanation}</p>
            </motion.div>
          )}
        </div>

        {bizSelected !== null && (
          <Button onClick={() => { setBizIndex(i => i + 1); setBizSelected(null); setBizTimer(45); }}
            className="w-full bg-primary hover:bg-primary/90 text-white">
            {bizIndex < businessQs.length - 1 ? 'Next Question' : 'See Results'} <ArrowRight size={14} />
          </Button>
        )}
      </div>
    );
  }

  // ─── Arithmetic Drill Mode ───
  const done = !running && timer <= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setRunning(false); setMode('select'); }} className="text-sm text-text-muted">← Back</button>
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-lg font-bold",
          timer <= 10 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-primary/10 text-primary")}>
          <Timer size={16} /> {timer}s
        </div>
        <div className="text-sm font-bold text-text-primary">{score}/{total}</div>
      </div>

      {done ? (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-8">
          <p className="text-5xl mb-3">⏰</p>
          <p className="text-2xl font-black text-text-primary mb-1">Time's Up!</p>
          <p className="text-lg text-text-muted mb-4">{score} correct out of {total}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setMode('select')}><RotateCcw size={14} /> Menu</Button>
            <Button onClick={() => startArithmetic(selectedOp)} className="bg-primary text-white">
              <Zap size={14} /> Again
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Question Display */}
          <div className="bg-bg-2 rounded-3xl p-6 border border-border text-center">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div key="result" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className={cn("absolute inset-0 flex items-center justify-center z-10 rounded-3xl",
                    result === 'correct' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                  {result === 'correct' ? <CheckCircle size={48} className="text-emerald-500" /> : <XCircle size={48} className="text-red-500" />}
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-3xl font-black text-text-primary mb-4">{currentQ?.question}</p>
            <div className="h-14 flex items-center justify-center border-b-2 border-primary/30 mx-8">
              <span className="text-2xl font-mono font-bold text-primary">{input || <span className="text-text-muted/30">?</span>}</span>
            </div>
          </div>

          {/* Custom Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','-','0','DEL'].map(key => (
              <button key={key} onClick={() => handleKeyPress(key)}
                className={cn(
                  "h-14 rounded-2xl font-bold text-lg transition-all active:scale-95",
                  key === 'DEL' ? "bg-red-500/10 text-red-500" :
                  key === '-' ? "bg-bg-2 border border-border text-text-primary" :
                  "bg-bg-2 border border-border text-text-primary hover:bg-bg-1"
                )}>
                {key === 'DEL' ? <Delete size={18} className="mx-auto" /> : key}
              </button>
            ))}
          </div>
          <Button onClick={() => handleKeyPress('GO')} disabled={!input}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-2xl">
            Submit
          </Button>
        </>
      )}
    </div>
  );
}
