import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Layers, Eye, CheckCircle, Mic, Briefcase, Award,
  BarChart2, Zap, ChevronRight, Crown, BookOpen, Lock, RotateCcw,
  Volume2, Send, PenLine, Clock, Target, Trophy, Star,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useContentAccess } from "@/hooks/useContentAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getMarketName } from "@/data/markets";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";
import { Button } from "@/components/ui/button";
import { DailyLimitGate } from "@/components/subscription/DailyLimitGate";
import {
  InterviewPath, InterviewStage, ConfidencePersona,
  STAGE_LABELS, CONFIDENCE_PERSONAS, STORY_HERO_STEPS,
  getMECEForMarket, getBigBossForMarket, getMCQForMarket,
  getMockPromptsForMarket, getMentalMathForMarket, getCaseStudiesForMarket,
  type MCQQuestion, type CaseStudy,
} from "@/data/interviewLabData";

// ─── Stage Tracker ───
function StageTracker({ current, onTap, path }: { current: InterviewStage; onTap: (s: InterviewStage) => void; path: InterviewPath }) {
  const stages = path === 'consulting'
    ? [1, 2, 3, 4, 5, 6] as InterviewStage[]
    : [1, 2, 3, 4, 6] as InterviewStage[]; // academic skips case sim

  const icons = { 1: Layers, 2: Eye, 3: CheckCircle, 4: Mic, 5: Briefcase, 6: BarChart2 };

  return (
    <div className="flex items-center justify-center px-6 mb-5 gap-0">
      {stages.map((s, i) => {
        const done = current > s;
        const active = current === s;
        const Icon = icons[s];
        return (
          <div key={s} className="flex items-center">
            {i > 0 && <div className={cn("h-0.5 w-6 sm:w-10", done || active ? "bg-violet-500" : "bg-border")} />}
            <button
              onClick={() => onTap(s)}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                active && "bg-violet-600 border-violet-600 text-white scale-110",
                done && "bg-emerald-500 border-emerald-500 text-white",
                !active && !done && "bg-bg-2 border-border text-text-muted"
              )}
            >
              <Icon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Score Bar ───
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted w-16">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-bg-1 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-text-muted w-6 text-right">{value}</span>
    </div>
  );
}

// ─── Vibe Meter ───
function VibeMeter({ text }: { text: string }) {
  const len = text.trim().length;
  const level = len < 30 ? 0 : len < 100 ? 1 : len < 250 ? 2 : 3;
  const labels = ['Too Short', 'Getting There', 'Good Length', 'Perfect! 🔥'];
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const widths = [15, 40, 70, 100];

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-bg-1 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${widths[level]}%`, backgroundColor: colors[level] }} />
      </div>
      <span className="text-[10px] font-bold w-20 text-right" style={{ color: colors[level] }}>{labels[level]}</span>
    </div>
  );
}

export default function InterviewLabPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkDailyLimit, incrementUsage, isProUser } = useContentAccess();
  const [market, setMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<InterviewPath | null>(null);
  const [stage, setStage] = useState<InterviewStage>(1);
  const [persona, setPersona] = useState<ConfidencePersona>('humble_leader');

  // MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [mcqScore, setMcqScore] = useState(0);

  // Mock state
  const [mockIndex, setMockIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Case study state
  const [caseIndex, setCaseIndex] = useState(0);
  const [caseTurn, setCaseTurn] = useState(0);
  const [caseResponses, setCaseResponses] = useState<string[]>([]);
  const [caseInput, setCaseInput] = useState('');

  // Daily limit check
  const interviewLimit = checkDailyLimit('trainer'); // reuse trainer limit for interviews

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('selected_market').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.selected_market) setMarket(data.selected_market);
        setLoading(false);
      });
  }, [user]);

  const submitMock = useCallback(async () => {
    if (!market || !user || userResponse.trim().length < 20) return;
    setSubmitting(true);
    hapticFeedback("medium");

    const prompts = getMockPromptsForMarket(market);
    const current = prompts[mockIndex % prompts.length];

    try {
      const { data, error } = await supabase.functions.invoke('interview-feedback', {
        body: { userResponse, scenario: current.scenario, question: current.question, buzzwords: current.buzzwords, persona, marketId: market, path: path || 'consulting' },
      });
      if (error) throw error;
      setFeedback(data);

      // Persist attempt
      await supabase.from('interview_lab_attempts').insert({
        user_id: user.id, market_id: market, path: path || 'consulting', stage: 4,
        attempt_type: 'mock', score: data?.score ?? 0,
        structure_score: data?.structureScore, content_score: data?.contentScore, persona_score: data?.personaScore,
        persona, scenario_question: current.question, user_response: userResponse, feedback: data,
        buzzwords_used: data?.buzzwordsUsed ?? [], buzzwords_missed: data?.buzzwordsMissed ?? [],
      });

      // Track daily usage
      incrementUsage('trainer');
    } catch (err) {
      console.error('Mock submission error:', err);
      setFeedback({
        score: 0, awesome: ['You tried!'], missing: ['Could not analyze — check your connection'],
        trySaying: 'Try again when you have a stable connection.',
        buzzwordsUsed: [], buzzwordsMissed: [],
        sophiaSays: 'Looks like we hit a glitch! Try again? 💪',
      });
    } finally {
      setSubmitting(false);
    }
  }, [market, user, userResponse, mockIndex, persona, path, incrementUsage]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // ─── Path Selection ───
  if (!path) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--primary)/0.15)] via-bg-0 to-bg-0">
          <div className="px-4 pt-safe pb-28 max-w-lg mx-auto">
            <button onClick={() => navigate('/practice')} className="flex items-center gap-2 text-text-muted mb-6 mt-4">
              <ArrowLeft size={18} /> <span className="text-sm">Back</span>
            </button>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-[28px] font-bold text-text-primary mb-1">Interview Lab</h1>
              <p className="text-sm text-text-muted mb-6">Career Accelerator — choose your path</p>
            </motion.div>

            {/* Daily limit indicator */}
            {!isProUser && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock size={14} className="text-amber-500" />
                <span className="text-xs text-amber-500 font-medium">
                  {interviewLimit.remaining} free mock{interviewLimit.remaining !== 1 ? 's' : ''} left today
                </span>
              </div>
            )}

            {/* Path A: Future Pro */}
            <motion.button
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onClick={() => { hapticFeedback("light"); setPath('consulting'); }}
              className="w-full mb-4 rounded-2xl overflow-hidden text-left bg-gradient-to-br from-violet-600 to-violet-800 p-6 shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                <Briefcase size={24} className="text-amber-200" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Path A: Future Pro</h3>
              <p className="text-xs text-white/70 mb-3">Consulting & Job Prep</p>
              <p className="text-sm text-white/85 leading-relaxed mb-4">
                Profitability cases, market entry analysis, brain teasers, and mental math.
              </p>
              <div className="flex gap-2 flex-wrap">
                {['Case Studies', 'Market Sizing', 'Mental Math', 'Case Simulator'].map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-white/15 text-[10px] text-white font-medium">{t}</span>
                ))}
              </div>
            </motion.button>

            {/* Path B: Academic Star */}
            <motion.button
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              onClick={() => { hapticFeedback("light"); setPath('academic'); }}
              className="w-full rounded-2xl overflow-hidden text-left bg-gradient-to-br from-indigo-700 to-indigo-900 p-6 shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                <Award size={24} className="text-indigo-200" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Path B: Academic Star</h3>
              <p className="text-xs text-white/70 mb-3">School & Scholarship Prep</p>
              <p className="text-sm text-white/85 leading-relaxed mb-4">
                Values alignment, impact storytelling, and the "Story Hero" method.
              </p>
              <div className="flex gap-2 flex-wrap">
                {['Story Hero', 'Impact', 'Values', 'Behavioral'].map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-white/15 text-[10px] text-white font-medium">{t}</span>
                ))}
              </div>
            </motion.button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const marketName = market ? getMarketName(market) : 'Industry';
  const mcqs = getMCQForMarket(market || '');
  const currentMCQ = mcqs[mcqIndex % mcqs.length];
  const mockPrompts = getMockPromptsForMarket(market || '');
  const currentMock = mockPrompts[mockIndex % mockPrompts.length];
  const framework = getMECEForMarket(market || '');
  const bigBoss = getBigBossForMarket(market || '');
  const mentalMath = getMentalMathForMarket(market || '');
  const caseStudies = getCaseStudiesForMarket(market || '');

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-bg-0">
        <div className="px-4 pt-safe pb-28 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 mt-2">
            <button
              onClick={() => { if (stage === 1) setPath(null); else setStage(Math.max(1, stage - 1) as InterviewStage); }}
              className="w-9 h-9 rounded-xl bg-bg-2 flex items-center justify-center"
            >
              <ArrowLeft size={16} className="text-text-primary" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Interview Lab</h2>
              <p className="text-[11px] text-text-muted">{marketName} • {path === 'consulting' ? 'Future Pro' : 'Academic Star'}</p>
            </div>
          </div>

          <StageTracker current={stage} onTap={setStage} path={path} />

          {/* ─── STAGE 1: Framework ─── */}
          <AnimatePresence mode="wait">
            {stage === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={18} className="text-violet-500" />
                  <h3 className="text-base font-bold text-text-primary">
                    {path === 'consulting' ? 'MECE Framework' : 'Story Hero Method'}
                  </h3>
                </div>

                {path === 'consulting' ? (
                  <>
                    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                      <p className="text-sm font-semibold text-text-primary mb-2">What is MECE?</p>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        <span className="font-bold text-violet-500">M</span>utually{' '}
                        <span className="font-bold text-violet-500">E</span>xclusive,{' '}
                        <span className="font-bold text-violet-500">C</span>ollectively{' '}
                        <span className="font-bold text-violet-500">E</span>xhaustive — every item in ONE category, NO item left out.
                      </p>
                    </div>
                    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                      <p className="text-sm font-semibold text-text-primary mb-2">🎯 {marketName} Example</p>
                      <p className="text-sm text-text-secondary mb-3">"{framework.label}"</p>
                      <div className="space-y-2 mb-3">
                        {framework.branches.map((b, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={cn("w-2 h-2 rounded-full mt-1.5", i === 0 ? "bg-emerald-500" : "bg-red-500")} />
                            <span className="text-sm text-text-primary">{b}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5">
                        <Zap size={14} className="text-amber-500 mt-0.5" />
                        <p className="text-xs text-text-secondary italic">{framework.example}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                      <p className="text-sm font-semibold text-text-primary mb-2">🦸 The Story Hero Method</p>
                      <p className="text-sm text-text-secondary">
                        Every great interview answer is a mini-story. You are the hero! Use these 4 steps.
                      </p>
                    </div>
                    {STORY_HERO_STEPS.map(step => (
                      <div key={step.letter} className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <span className="text-xl font-black text-violet-600">{step.letter}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{step.label}</p>
                            <p className="text-xs text-text-secondary">{step.prompt}</p>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-violet-500/5">
                          <p className="text-xs text-text-secondary italic">"{step.example}"</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                <Button onClick={() => { hapticFeedback("light"); setStage(2); }} className="w-full bg-violet-600 hover:bg-violet-700 text-white mt-2">
                  Next: Expectations <ChevronRight size={16} />
                </Button>
              </motion.div>
            )}

            {/* ─── STAGE 2: Big Boss Questions ─── */}
            {stage === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={18} className="text-blue-500" />
                  <h3 className="text-base font-bold text-text-primary">Top 5 "Big Boss" Questions</h3>
                </div>
                <p className="text-sm text-text-muted mb-4">Questions that separate good from great in {marketName}.</p>

                {bigBoss.map((q, i) => (
                  <div key={i} className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                    <div className="flex gap-3 mb-2">
                      <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-violet-600">{i + 1}</span>
                      </div>
                      <p className="text-sm font-semibold text-text-primary">{q.question}</p>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5">
                      <Zap size={12} className="text-amber-500 mt-0.5" />
                      <p className="text-xs text-text-secondary italic">{q.tip}</p>
                    </div>
                  </div>
                ))}

                {/* Mental Math */}
                {path === 'consulting' && mentalMath.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-5 mb-3">
                      <Clock size={18} className="text-red-500" />
                      <h3 className="text-base font-bold text-text-primary">🧮 Mental Math Minute</h3>
                    </div>
                    {mentalMath.map((q, i) => (
                      <MathDrillCard key={i} question={q} />
                    ))}
                  </>
                )}

                <Button onClick={() => { hapticFeedback("light"); setStage(3); setMcqIndex(0); setMcqSelected(null); setMcqScore(0); }} className="w-full bg-violet-600 hover:bg-violet-700 text-white mt-2">
                  Next: Practice MCQs <ChevronRight size={16} />
                </Button>
              </motion.div>
            )}

            {/* ─── STAGE 3: MCQ Practice ─── */}
            {stage === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <h3 className="text-base font-bold text-text-primary">
                    {path === 'consulting' ? 'Case Practice' : 'Values & Impact'}
                  </h3>
                </div>
                <p className="text-sm text-text-muted mb-4">Question {mcqIndex + 1} of {mcqs.length}</p>

                <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                  <p className="text-sm font-semibold text-text-primary mb-4">{currentMCQ.question}</p>
                  <div className="space-y-2">
                    {currentMCQ.options.map((opt, i) => {
                      const selected = mcqSelected === i;
                      const correct = i === currentMCQ.correctIndex;
                      const revealed = mcqSelected !== null;
                      return (
                        <button
                          key={i}
                          disabled={revealed}
                          onClick={() => {
                            setMcqSelected(i);
                            hapticFeedback(i === currentMCQ.correctIndex ? "medium" : "heavy");
                            if (i === currentMCQ.correctIndex) setMcqScore(s => s + 1);
                            if (user && market && path) {
                              supabase.from('interview_lab_attempts').insert({
                                user_id: user.id, market_id: market, path, stage: 3,
                                attempt_type: 'mcq', score: i === currentMCQ.correctIndex ? 100 : 0,
                                scenario_question: currentMCQ.question,
                              });
                            }
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left",
                            !revealed && "border-border hover:border-violet-400",
                            revealed && correct && "border-emerald-500 bg-emerald-500/5",
                            selected && !correct && "border-red-500 bg-red-500/5",
                          )}
                        >
                          <span className={cn("text-sm text-text-primary", revealed && correct && "text-emerald-600")}>{opt}</span>
                          {revealed && correct && <CheckCircle size={16} className="text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                  {mcqSelected !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-500/5">
                      <p className="text-xs text-text-secondary">{currentMCQ.explanation}</p>
                    </div>
                  )}
                </div>

                {mcqSelected !== null && (
                  <Button
                    onClick={() => {
                      hapticFeedback("light");
                      if (mcqIndex < mcqs.length - 1) { setMcqIndex(i => i + 1); setMcqSelected(null); }
                      else setStage(4);
                    }}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {mcqIndex < mcqs.length - 1 ? 'Next Question' : 'Go to Mock Lab'} <ChevronRight size={16} />
                  </Button>
                )}
              </motion.div>
            )}

            {/* ─── STAGE 4: Mock Lab ─── */}
            {stage === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {/* Daily limit gate */}
                {!isProUser && !interviewLimit.canAccess ? (
                  <DailyLimitGate type="trainer" onContinue={() => {}} />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Mic size={18} className="text-violet-500" />
                      <h3 className="text-base font-bold text-text-primary">Mock Lab with Sophia</h3>
                    </div>

                    {/* Persona selector */}
                    {!feedback && (
                      <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                        <p className="text-sm font-semibold text-text-primary mb-2">Choose Your Persona</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(Object.entries(CONFIDENCE_PERSONAS) as [ConfidencePersona, typeof CONFIDENCE_PERSONAS[ConfidencePersona]][]).map(([key, p]) => (
                            <button
                              key={key}
                              onClick={() => { setPersona(key); hapticFeedback("light"); }}
                              className={cn(
                                "p-3 rounded-xl border-2 text-center transition-all",
                                persona === key ? "border-violet-500 bg-violet-500/5" : "border-border"
                              )}
                            >
                              <span className="text-xl block mb-1">{p.emoji}</span>
                              <span className={cn("text-[10px] font-medium", persona === key ? "text-violet-500" : "text-text-muted")}>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scenario card */}
                    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <span className="text-xl">👩‍💼</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">Sophia Hernández</p>
                          <p className="text-[11px] text-text-muted">Case Interview Coach</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-violet-500/5 mb-2">
                        <p className="text-sm text-text-secondary leading-relaxed">{currentMock.scenario}</p>
                      </div>
                      <p className="text-sm font-bold text-text-primary">{currentMock.question}</p>
                    </div>

                    {/* Response */}
                    {!feedback && (
                      <>
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-text-primary">Your Response</p>
                          </div>
                          <textarea
                            className="w-full min-h-[160px] p-3 rounded-xl border-2 border-border bg-bg-1 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-violet-500 focus:outline-none transition-colors"
                            placeholder="Type your answer here... Start with 'First, I would...' for structure."
                            value={userResponse}
                            onChange={(e) => setUserResponse(e.target.value)}
                          />
                          <VibeMeter text={userResponse} />
                        </div>
                        <Button
                          onClick={submitMock}
                          disabled={submitting || userResponse.trim().length < 20}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40"
                        >
                          {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Submit to Sophia <Send size={14} /></>}
                        </Button>
                      </>
                    )}

                    {/* Feedback */}
                    {feedback && (
                      <div className="space-y-3 mt-2">
                        {/* Score card */}
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-violet-600">{feedback.score ?? 0}</span>
                            <span className="text-[10px] text-text-muted">/100</span>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <ScoreBar label="Structure" value={feedback.structureScore ?? 0} color="#7C3AED" />
                            <ScoreBar label="Content" value={feedback.contentScore ?? 0} color="#3B82F6" />
                            <ScoreBar label="Persona" value={feedback.personaScore ?? 0} color="#F59E0B" />
                          </div>
                        </div>

                        {/* Sophia Says */}
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                              <span className="text-lg">👩‍💼</span>
                            </div>
                            <p className="text-sm text-text-secondary italic">{feedback.sophiaSays}</p>
                          </div>
                        </div>

                        {/* Awesome */}
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border border-l-4 border-l-emerald-500">
                          <p className="text-sm font-bold text-text-primary mb-2">✅ What Was Awesome</p>
                          {(feedback.awesome || []).map((b: string, i: number) => (
                            <p key={i} className="text-sm text-text-secondary mb-1">• {b}</p>
                          ))}
                        </div>

                        {/* Missing */}
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border border-l-4 border-l-amber-500">
                          <p className="text-sm font-bold text-text-primary mb-2">⚡ What Was Missing</p>
                          {(feedback.missing || []).map((b: string, i: number) => (
                            <p key={i} className="text-sm text-text-secondary mb-1">• {b}</p>
                          ))}
                        </div>

                        {/* Try Saying */}
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border border-l-4 border-l-violet-500">
                          <p className="text-sm font-bold text-text-primary mb-2">💡 Try Saying This Instead</p>
                          <p className="text-sm text-violet-500 italic leading-relaxed">"{feedback.trySaying}"</p>
                        </div>

                        {/* Buzzwords */}
                        {((feedback.buzzwordsUsed?.length > 0) || (feedback.buzzwordsMissed?.length > 0)) && (
                          <div className="bg-bg-2 rounded-2xl p-4 border border-border">
                            <p className="text-sm font-bold text-text-primary mb-3">🔑 Buzzword Detector</p>
                            {feedback.buzzwordsUsed?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-[11px] text-text-muted mb-1.5">Used ✅</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {feedback.buzzwordsUsed.map((w: string) => (
                                    <span key={w} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-[11px] text-emerald-600 font-medium">{w}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {feedback.buzzwordsMissed?.length > 0 && (
                              <div>
                                <p className="text-[11px] text-text-muted mb-1.5">Missed 🎯</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {feedback.buzzwordsMissed.map((w: string) => (
                                    <span key={w} className="px-2 py-1 rounded-lg bg-amber-500/10 text-[11px] text-amber-600 font-medium">{w}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => { setFeedback(null); setUserResponse(''); }}
                            className="flex-1 border-violet-500 text-violet-500"
                          >
                            <RotateCcw size={14} /> Try Again
                          </Button>
                          <Button
                            onClick={() => { setFeedback(null); setUserResponse(''); setMockIndex(i => i + 1); }}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            Next Scenario <ChevronRight size={14} />
                          </Button>
                        </div>

                        {/* Continue to Case Sim (consulting) or Analytics */}
                        <Button
                          variant="ghost"
                          onClick={() => setStage(path === 'consulting' ? 5 : 6)}
                          className="w-full text-text-muted"
                        >
                          Continue to {path === 'consulting' ? 'Case Simulator' : 'Analytics'} <ChevronRight size={14} />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ─── STAGE 5: Case Study Simulator (Pro) ─── */}
            {stage === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={18} className="text-violet-500" />
                  <h3 className="text-base font-bold text-text-primary">Case Study Simulator</h3>
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500 text-white">
                    <Crown size={8} /> PRO
                  </span>
                </div>

                {!isProUser ? (
                  <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
                    <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4">
                      <Lock size={24} className="text-violet-500" />
                    </div>
                    <h4 className="text-base font-bold text-text-primary mb-2">Unlock Multi-Turn Case Interviews</h4>
                    <p className="text-sm text-text-muted mb-4">Practice McKinsey-style cases with Sophia guiding each turn.</p>
                    <Button onClick={() => navigate('/subscription')} className="bg-violet-600 text-white">
                      <Crown size={14} /> Upgrade to Pro
                    </Button>
                  </div>
                ) : caseStudies.length > 0 ? (
                  <>
                    {/* Case selection */}
                    <div className="space-y-3 mb-4">
                      {caseStudies.map((cs, i) => (
                        <button
                          key={cs.id}
                          onClick={() => { setCaseIndex(i); setCaseTurn(0); setCaseResponses([]); setCaseInput(''); }}
                          className={cn(
                            "w-full bg-bg-2 rounded-2xl p-4 border-2 text-left transition-all",
                            caseIndex === i ? "border-violet-500" : "border-border"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-text-primary">{cs.title}</p>
                            <span className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-full",
                              cs.difficulty === 'beginner' ? "bg-emerald-500/10 text-emerald-500" :
                              cs.difficulty === 'intermediate' ? "bg-amber-500/10 text-amber-500" :
                              "bg-red-500/10 text-red-500"
                            )}>
                              {cs.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted">{cs.summary}</p>
                        </button>
                      ))}
                    </div>

                    {/* Active case */}
                    {caseStudies[caseIndex] && (
                      <div className="space-y-3">
                        {/* Previous turns */}
                        {caseStudies[caseIndex].turns.slice(0, caseTurn + 1).map((turn, ti) => (
                          <div key={ti}>
                            <div className="bg-bg-2 rounded-2xl p-4 border border-border">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">👩‍💼</span>
                                <span className="text-xs font-bold text-violet-500">Sophia — Turn {ti + 1}</span>
                              </div>
                              <p className="text-sm text-text-secondary">{turn.prompt}</p>
                            </div>
                            {caseResponses[ti] && (
                              <div className="bg-violet-500/5 rounded-2xl p-4 border border-violet-500/20 mt-2">
                                <p className="text-xs font-bold text-violet-500 mb-1">Your Response</p>
                                <p className="text-sm text-text-primary">{caseResponses[ti]}</p>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Response input for current turn */}
                        {caseTurn < caseStudies[caseIndex].turns.length && !caseResponses[caseTurn] && (
                          <div className="space-y-2">
                            <textarea
                              className="w-full min-h-[120px] p-3 rounded-xl border-2 border-border bg-bg-1 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-violet-500 focus:outline-none"
                              placeholder="Structure your response..."
                              value={caseInput}
                              onChange={(e) => setCaseInput(e.target.value)}
                            />
                            <VibeMeter text={caseInput} />
                            <Button
                              disabled={caseInput.trim().length < 15}
                              onClick={() => {
                                const newResponses = [...caseResponses, caseInput];
                                setCaseResponses(newResponses);
                                setCaseInput('');
                                if (caseTurn + 1 < caseStudies[caseIndex].turns.length) {
                                  setCaseTurn(t => t + 1);
                                }
                                hapticFeedback("light");
                              }}
                              className="w-full bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40"
                            >
                              {caseTurn + 1 < caseStudies[caseIndex].turns.length ? 'Submit & Next Turn' : 'Complete Case'} <Send size={14} />
                            </Button>
                          </div>
                        )}

                        {/* Case complete */}
                        {caseResponses.length >= caseStudies[caseIndex].turns.length && (
                          <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 text-center">
                            <Trophy size={32} className="text-emerald-500 mx-auto mb-2" />
                            <p className="text-base font-bold text-text-primary mb-1">Case Complete! 🎉</p>
                            <p className="text-sm text-text-muted">You navigated all {caseStudies[caseIndex].turns.length} turns.</p>
                            <Button
                              onClick={() => setStage(6)}
                              className="bg-violet-600 text-white mt-3"
                            >
                              View Analytics <ChevronRight size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
                    <p className="text-sm text-text-muted">No case studies available for this industry yet. Check back soon!</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── STAGE 6: Analytics & Leaderboard ─── */}
            {stage === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <InterviewAnalytics userId={user?.id} marketId={market} path={path} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Math Drill Card ───
function MathDrillCard({ question: q }: { question: { question: string; options: string[]; correctIndex: number; explanation: string } }) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected !== null;

  return (
    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
      <p className="text-sm font-semibold text-text-primary mb-3">{q.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={revealed}
            onClick={() => { setSelected(i); hapticFeedback(i === q.correctIndex ? "success" : "error"); }}
            className={cn(
              "p-2.5 rounded-xl border-2 text-sm font-semibold text-center transition-all",
              !revealed && "border-border hover:border-violet-400",
              revealed && i === q.correctIndex && "border-emerald-500 bg-emerald-500/5",
              selected === i && i !== q.correctIndex && "border-red-500 bg-red-500/5",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {revealed && <p className="text-xs text-text-secondary mt-3">{q.explanation}</p>}
    </div>
  );
}

// ─── Analytics Component ───
function InterviewAnalytics({ userId, marketId, path }: { userId?: string; marketId: string | null; path: InterviewPath | null }) {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isProUser } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !marketId) return;
    
    Promise.all([
      supabase.from('interview_lab_attempts')
        .select('score, structure_score, content_score, persona_score, created_at, attempt_type')
        .eq('user_id', userId).eq('market_id', marketId)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('interview_leaderboard')
        .select('*, profiles!inner(username, avatar_url)')
        .eq('market_id', marketId)
        .order('avg_score', { ascending: false }).limit(10),
    ]).then(([attemptsRes, leaderboardRes]) => {
      setAnalytics(attemptsRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
      setLoading(false);
    });
  }, [userId, marketId]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const mockAttempts = analytics.filter(a => a.attempt_type === 'mock');
  const avgScore = mockAttempts.length > 0 ? Math.round(mockAttempts.reduce((s, a) => s + (a.score || 0), 0) / mockAttempts.length) : 0;
  const bestScore = mockAttempts.length > 0 ? Math.max(...mockAttempts.map(a => a.score || 0)) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-violet-500" />
        <h3 className="text-base font-bold text-text-primary">Performance Analytics</h3>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-bg-2 rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-black text-violet-500">{mockAttempts.length}</p>
          <p className="text-[10px] text-text-muted">Mocks Done</p>
        </div>
        <div className="bg-bg-2 rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-black text-emerald-500">{avgScore}</p>
          <p className="text-[10px] text-text-muted">Avg Score</p>
        </div>
        <div className="bg-bg-2 rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-black text-amber-500">{bestScore}</p>
          <p className="text-[10px] text-text-muted">Best Score</p>
        </div>
      </div>

      {/* Score breakdown averages */}
      {mockAttempts.length > 0 && (
        <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-4">
          <p className="text-sm font-bold text-text-primary mb-3">Score Breakdown</p>
          <div className="space-y-2">
            <ScoreBar label="Structure" value={Math.round(mockAttempts.reduce((s, a) => s + (a.structure_score || 0), 0) / mockAttempts.length)} color="#7C3AED" />
            <ScoreBar label="Content" value={Math.round(mockAttempts.reduce((s, a) => s + (a.content_score || 0), 0) / mockAttempts.length)} color="#3B82F6" />
            <ScoreBar label="Persona" value={Math.round(mockAttempts.reduce((s, a) => s + (a.persona_score || 0), 0) / mockAttempts.length)} color="#F59E0B" />
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="text-base font-bold text-text-primary">Weekly Leaderboard</h3>
      </div>

      {!isProUser ? (
        <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
          <Lock size={24} className="text-violet-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-text-primary mb-1">Leaderboard is Pro-only</p>
          <p className="text-xs text-text-muted mb-3">See how you rank against other candidates.</p>
          <Button onClick={() => navigate('/subscription')} size="sm" className="bg-violet-600 text-white">
            <Crown size={12} /> Upgrade
          </Button>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <div key={entry.id} className={cn(
              "bg-bg-2 rounded-xl p-3 border border-border flex items-center gap-3",
              i < 3 && "border-amber-500/30"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                i === 0 ? "bg-amber-400 text-white" :
                i === 1 ? "bg-gray-300 text-white" :
                i === 2 ? "bg-amber-700 text-white" :
                "bg-bg-1 text-text-muted"
              )}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{entry.profiles?.username || 'Anonymous'}</p>
                <p className="text-[10px] text-text-muted">{entry.mocks_completed} mocks</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-violet-500">{Math.round(entry.avg_score)}</p>
                <p className="text-[10px] text-text-muted">avg</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
          <Star size={24} className="text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No leaderboard data yet. Complete mock interviews to rank!</p>
        </div>
      )}

      {/* Recent attempts */}
      {analytics.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-text-primary mb-3">Recent Attempts</p>
          <div className="space-y-2">
            {analytics.slice(0, 5).map((a, i) => (
              <div key={i} className="bg-bg-2 rounded-xl p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-primary capitalize">{a.attempt_type}</p>
                  <p className="text-[10px] text-text-muted">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  (a.score || 0) >= 80 ? "text-emerald-500" : (a.score || 0) >= 50 ? "text-amber-500" : "text-red-500"
                )}>
                  {a.score ?? 0}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
