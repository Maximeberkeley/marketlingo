import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Layers, Eye, CheckCircle, Mic, Briefcase, Award,
  Zap, ChevronRight, Crown, Lock, RotateCcw,
  Send, Clock, Trophy, Target, Users, Cpu, Palette,
  Lightbulb, Key, AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useContentAccess } from "@/hooks/useContentAccess";
import { supabase } from "@/integrations/supabase/client";
import { getMarketName } from "@/data/markets";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";
import { Button } from "@/components/ui/button";
import { DailyLimitGate } from "@/components/subscription/DailyLimitGate";
import { updateLeaderboard } from "@/lib/leaderboardUtils";
import { StageTracker } from "@/components/interview-lab/StageTracker";
import { ScoreBar } from "@/components/interview-lab/ScoreBar";
import { VibeMeter } from "@/components/interview-lab/VibeMeter";
import { MathDrillCard } from "@/components/interview-lab/MathDrillCard";
import { InterviewAnalytics } from "@/components/interview-lab/InterviewAnalytics";
import {
  InterviewPath, InterviewStage, ConfidencePersona,
  CONFIDENCE_PERSONAS, STORY_HERO_STEPS,
  getMECEForMarket, getBigBossForMarket, getMCQForMarket,
  getMockPromptsForMarket, getMentalMathForMarket, getCaseStudiesForMarket,
} from "@/data/interviewLabData";

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
  const [caseFeedback, setCaseFeedback] = useState<any>(null);
  const [caseSubmitting, setCaseSubmitting] = useState(false);

  const interviewLimit = checkDailyLimit('trainer');

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

      const score = data?.score ?? 0;

      // Persist attempt
      await supabase.from('interview_lab_attempts').insert({
        user_id: user.id, market_id: market, path: path || 'consulting', stage: 4,
        attempt_type: 'mock', score,
        structure_score: data?.structureScore, content_score: data?.contentScore, persona_score: data?.personaScore,
        persona, scenario_question: current.question, user_response: userResponse, feedback: data,
        buzzwords_used: data?.buzzwordsUsed ?? [], buzzwords_missed: data?.buzzwordsMissed ?? [],
      });

      // Update leaderboard
      await updateLeaderboard(user.id, market, score);

      incrementUsage('trainer');
    } catch (err) {
      console.error('Mock submission error:', err);
      setFeedback({
        score: 0, awesome: ['You tried!'], missing: ['Could not analyze — check your connection'],
        trySaying: 'Try again when you have a stable connection.',
        buzzwordsUsed: [], buzzwordsMissed: [],
        sophiaSays: 'Looks like we hit a glitch! Try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [market, user, userResponse, mockIndex, persona, path, incrementUsage]);

  const submitCaseForFeedback = useCallback(async () => {
    if (!market || !user || caseResponses.length === 0) return;
    setCaseSubmitting(true);

    const cs = getCaseStudiesForMarket(market || '')[caseIndex];
    if (!cs) { setCaseSubmitting(false); return; }

    try {
      const conversationSummary = cs.turns.map((turn, i) => 
        `Sophia (Turn ${i+1}): ${turn.prompt}\nCandidate: ${caseResponses[i] || '(no response)'}`
      ).join('\n\n');

      const { data, error } = await supabase.functions.invoke('interview-feedback', {
        body: {
          userResponse: conversationSummary,
          scenario: `Multi-turn case study: ${cs.title}. ${cs.summary}`,
          question: 'Evaluate the full case interview performance across all turns.',
          buzzwords: [],
          persona,
          marketId: market,
          path: 'consulting',
        },
      });
      if (error) throw error;
      setCaseFeedback(data);

      // Persist case attempt
      await supabase.from('interview_lab_attempts').insert({
        user_id: user.id, market_id: market, path: 'consulting', stage: 5,
        attempt_type: 'case_study', score: data?.score ?? 0,
        structure_score: data?.structureScore, content_score: data?.contentScore, persona_score: data?.personaScore,
        persona, scenario_question: cs.title, user_response: conversationSummary, feedback: data,
      });

      await updateLeaderboard(user.id, market, data?.score ?? 0);
    } catch (err) {
      console.error('Case feedback error:', err);
      setCaseFeedback({
        score: 0, sophiaSays: 'Could not generate feedback — try again!',
        awesome: [], missing: [], trySaying: '',
      });
    } finally {
      setCaseSubmitting(false);
    }
  }, [market, user, caseResponses, caseIndex, persona]);

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
            {!isProUser && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock size={14} className="text-amber-500" />
                <span className="text-xs text-amber-500 font-medium">
                  {interviewLimit.remaining} free mock{interviewLimit.remaining !== 1 ? 's' : ''} left today
                </span>
              </div>
            )}
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

          <AnimatePresence mode="wait">
            {/* ─── STAGE 1: Framework ─── */}
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
                      <p className="text-sm font-semibold text-text-primary mb-2"><Target size={14} className="inline mr-1 text-violet-500" />{marketName} Example</p>
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
                      <p className="text-sm font-semibold text-text-primary mb-2">The Story Hero Method</p>
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
                {path === 'consulting' && mentalMath.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-5 mb-3">
                      <Clock size={18} className="text-red-500" />
                      <h3 className="text-base font-bold text-text-primary">Mental Math Minute</h3>
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
                {!isProUser && !interviewLimit.canAccess ? (
                  <DailyLimitGate type="trainer" onContinue={() => {}} />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Mic size={18} className="text-violet-500" />
                      <h3 className="text-base font-bold text-text-primary">Mock Lab with Sophia</h3>
                    </div>
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
                              <div className="flex justify-center mb-1">
                                {key === 'humble_leader' ? <Users size={20} className="text-violet-500" /> :
                                 key === 'tech_genius' ? <Cpu size={20} className="text-violet-500" /> :
                                 <Palette size={20} className="text-violet-500" />}
                              </div>
                              <span className={cn("text-[10px] font-medium", persona === key ? "text-violet-500" : "text-text-muted")}>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <Mic size={20} className="text-violet-600" />
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
                    {!feedback && (
                      <>
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                          <p className="text-sm font-semibold text-text-primary mb-2">Your Response</p>
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
                    {feedback && (
                      <FeedbackDisplay
                        feedback={feedback}
                        onRetry={() => { setFeedback(null); setUserResponse(''); }}
                        onNext={() => { setFeedback(null); setUserResponse(''); setMockIndex(i => i + 1); }}
                        onContinue={() => setStage(path === 'consulting' ? 5 : 6)}
                        continueLabel={path === 'consulting' ? 'Case Simulator' : 'Analytics'}
                      />
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
                    <div className="grid gap-2 mb-4">
                      {caseStudies.map((cs, i) => (
                        <button
                          key={cs.id}
                          onClick={() => { setCaseIndex(i); setCaseTurn(0); setCaseResponses([]); setCaseInput(''); setCaseFeedback(null); hapticFeedback("light"); }}
                          className={cn(
                            "bg-bg-2 rounded-xl p-3 border-2 text-left transition-all",
                            caseIndex === i ? "border-violet-500 bg-violet-500/5" : "border-border"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-text-primary">{cs.title}</p>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded",
                              cs.difficulty === 'beginner' ? "bg-emerald-500/10 text-emerald-600" :
                              cs.difficulty === 'intermediate' ? "bg-amber-500/10 text-amber-600" :
                              "bg-red-500/10 text-red-600"
                            )}>
                              {cs.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted">{cs.summary}</p>
                        </button>
                      ))}
                    </div>
                    {caseStudies[caseIndex] && (
                      <div className="space-y-3">
                        {caseStudies[caseIndex].turns.slice(0, caseTurn + 1).map((turn, ti) => (
                          <div key={ti}>
                            <div className="bg-bg-2 rounded-2xl p-4 border border-border">
                              <div className="flex items-center gap-2 mb-2">
                                <Mic size={16} className="text-violet-500" />
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
                        {/* Case complete — get AI feedback */}
                        {caseResponses.length >= caseStudies[caseIndex].turns.length && !caseFeedback && (
                          <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 text-center">
                            <Trophy size={32} className="text-emerald-500 mx-auto mb-2" />
                            <p className="text-base font-bold text-text-primary mb-1">Case Complete!</p>
                            <p className="text-sm text-text-muted mb-3">You navigated all {caseStudies[caseIndex].turns.length} turns.</p>
                            <Button
                              onClick={submitCaseForFeedback}
                              disabled={caseSubmitting}
                              className="bg-violet-600 text-white"
                            >
                              {caseSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>Get AI Feedback <ChevronRight size={14} /></>
                              )}
                            </Button>
                          </div>
                        )}
                        {caseFeedback && (
                          <FeedbackDisplay
                            feedback={caseFeedback}
                            onRetry={() => { setCaseFeedback(null); setCaseResponses([]); setCaseTurn(0); }}
                            onNext={() => { setCaseFeedback(null); setCaseResponses([]); setCaseTurn(0); setCaseIndex(i => (i + 1) % caseStudies.length); }}
                            onContinue={() => setStage(6)}
                            continueLabel="Analytics"
                          />
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

// ─── Shared Feedback Display ───
function FeedbackDisplay({ feedback, onRetry, onNext, onContinue, continueLabel }: {
  feedback: any;
  onRetry: () => void;
  onNext: () => void;
  onContinue: () => void;
  continueLabel: string;
}) {
  return (
    <div className="space-y-3 mt-2">
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
      <div className="bg-bg-2 rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            <Mic size={18} className="text-violet-600" />
          </div>
          <p className="text-sm text-text-secondary italic">{feedback.sophiaSays}</p>
        </div>
      </div>
      {(feedback.awesome || []).length > 0 && (
        <div className="bg-bg-2 rounded-2xl p-4 border border-border border-l-4 border-l-emerald-500">
          <p className="text-sm font-bold text-text-primary mb-2"><CheckCircle size={14} className="inline mr-1 text-emerald-500" />What Was Awesome</p>
          {(feedback.awesome || []).map((b: string, i: number) => (
            <p key={i} className="text-sm text-text-secondary mb-1">• {b}</p>
          ))}
        </div>
      )}
      {(feedback.missing || []).length > 0 && (
        <div className="bg-bg-2 rounded-2xl p-4 border border-border border-l-4 border-l-amber-500">
          <p className="text-sm font-bold text-text-primary mb-2"><AlertTriangle size={14} className="inline mr-1 text-amber-500" />What Was Missing</p>
          {(feedback.missing || []).map((b: string, i: number) => (
            <p key={i} className="text-sm text-text-secondary mb-1">• {b}</p>
          ))}
        </div>
      )}
      {feedback.trySaying && (
        <div className="bg-bg-2 rounded-2xl p-4 border border-border border-l-4 border-l-violet-500">
          <p className="text-sm font-bold text-text-primary mb-2">💡 Try Saying This Instead</p>
          <p className="text-sm text-violet-500 italic leading-relaxed">"{feedback.trySaying}"</p>
        </div>
      )}
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
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} className="flex-1 border-violet-500 text-violet-500">
          <RotateCcw size={14} /> Try Again
        </Button>
        <Button onClick={onNext} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
          Next Scenario <ChevronRight size={14} />
        </Button>
      </div>
      <Button variant="ghost" onClick={onContinue} className="w-full text-text-muted">
        Continue to {continueLabel} <ChevronRight size={14} />
      </Button>
    </div>
  );
}
