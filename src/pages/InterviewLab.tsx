import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mic, Briefcase, Award,
  Zap, ChevronRight, Crown, Lock, RotateCcw,
  Send, Clock, Trophy, Users, Cpu, Palette,
  Lightbulb, Key, AlertTriangle, CheckCircle,
  BookOpen, Hash, MessageSquare, Layers,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useContentAccess } from "@/hooks/useContentAccess";
import { supabase } from "@/integrations/supabase/client";
import { getMarketName } from "@/data/markets";
import { markets } from "@/data/markets";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";
import { Button } from "@/components/ui/button";
import { DailyLimitGate } from "@/components/subscription/DailyLimitGate";
import { updateLeaderboard } from "@/lib/leaderboardUtils";
import { StageTracker } from "@/components/interview-lab/StageTracker";
import { ScoreBar } from "@/components/interview-lab/ScoreBar";
import { VibeMeter } from "@/components/interview-lab/VibeMeter";
import { InterviewAnalytics } from "@/components/interview-lab/InterviewAnalytics";
import { MentalMathEngine } from "@/components/interview-lab/MentalMathEngine";
import { FrameworksLibrary } from "@/components/interview-lab/FrameworksLibrary";
import { BehavioralQA } from "@/components/interview-lab/BehavioralQA";
import { GlossaryAchievements } from "@/components/interview-lab/GlossaryAchievements";
import {
  InterviewPath, InterviewStage, ConfidencePersona,
  CONFIDENCE_PERSONAS, STAGE_LABELS,
  getMECEForMarket, getBigBossForMarket, getMCQForMarket,
  getMockPromptsForMarket, getMentalMathForMarket, getCaseStudiesForMarket,
} from "@/data/interviewLabData";

import leoGraduation from "@/assets/leo-graduation.png";
import sophiaAvatar from "@/assets/sophia-hernandez.png";

type TabKey = 'learn' | 'math' | 'frameworks' | 'glossary';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'learn', label: 'Learn', icon: <BookOpen size={18} /> },
  { key: 'math', label: 'Math', icon: <Hash size={18} /> },
  { key: 'frameworks', label: 'Frameworks', icon: <Layers size={18} /> },
  { key: 'glossary', label: 'More', icon: <Award size={18} /> },
];

export default function InterviewLabPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkDailyLimit, incrementUsage, isProUser } = useContentAccess();
  const [market, setMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('learn');

  // Learn tab state
  const [path, setPath] = useState<InterviewPath>('consulting');
  const [stage, setStage] = useState<InterviewStage>(1);
  const [persona, setPersona] = useState<ConfidencePersona>('humble_leader');
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [mcqScore, setMcqScore] = useState(0);
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

  // Gamification state
  const [mathDrillsCompleted, setMathDrillsCompleted] = useState(0);
  const [notesSaved, setNotesSaved] = useState(0);
  const [frameworksRead, setFrameworksRead] = useState(0);
  const [readFrameworkIds, setReadFrameworkIds] = useState<Set<string>>(new Set());

  const interviewLimit = checkDailyLimit('trainer');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('selected_market').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.selected_market) setMarket(data.selected_market);
        setLoading(false);
      });
  }, [user]);

  // Load stats
  useEffect(() => {
    if (!user) return;
    supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id).eq('linked_label', 'interview-qa')
      .then(({ count }) => { if (count) setNotesSaved(count); });
  }, [user]);

  const handleFrameworkRead = (id: string) => {
    if (!readFrameworkIds.has(id)) {
      setReadFrameworkIds(prev => new Set([...prev, id]));
      setFrameworksRead(prev => prev + 1);
    }
  };

  const submitMock = useCallback(async () => {
    if (!market || !user || userResponse.trim().length < 20) return;
    setSubmitting(true);
    hapticFeedback("medium");

    const prompts = getMockPromptsForMarket(market);
    const current = prompts[mockIndex % prompts.length];

    try {
      const { data, error } = await supabase.functions.invoke('interview-feedback', {
        body: { userResponse, scenario: current.scenario, question: current.question, buzzwords: current.buzzwords, persona, marketId: market, path },
      });
      if (error) throw error;
      setFeedback(data);
      const score = data?.score ?? 0;
      await supabase.from('interview_lab_attempts').insert({
        user_id: user.id, market_id: market, path, stage: 4,
        attempt_type: 'mock', score,
        structure_score: data?.structureScore, content_score: data?.contentScore, persona_score: data?.personaScore,
        persona, scenario_question: current.question, user_response: userResponse, feedback: data,
        buzzwords_used: data?.buzzwordsUsed ?? [], buzzwords_missed: data?.buzzwordsMissed ?? [],
      });
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
        `Sophia (Turn ${i + 1}): ${turn.prompt}\nCandidate: ${caseResponses[i] || '(no response)'}`
      ).join('\n\n');
      const { data, error } = await supabase.functions.invoke('interview-feedback', {
        body: {
          userResponse: conversationSummary,
          scenario: `Multi-turn case study: ${cs.title}. ${cs.summary}`,
          question: 'Evaluate the full case interview performance across all turns.',
          buzzwords: [], persona, marketId: market, path: 'consulting',
        },
      });
      if (error) throw error;
      setCaseFeedback(data);
      await supabase.from('interview_lab_attempts').insert({
        user_id: user.id, market_id: market, path: 'consulting', stage: 5,
        attempt_type: 'case_study', score: data?.score ?? 0,
        structure_score: data?.structureScore, content_score: data?.contentScore, persona_score: data?.personaScore,
        persona, scenario_question: cs.title, user_response: conversationSummary, feedback: data,
      });
      await updateLeaderboard(user.id, market, data?.score ?? 0);
    } catch (err) {
      console.error('Case feedback error:', err);
      setCaseFeedback({ score: 0, sophiaSays: 'Could not generate feedback — try again!', awesome: [], missing: [], trySaying: '' });
    } finally {
      setCaseSubmitting(false);
    }
  }, [market, user, caseResponses, caseIndex, persona]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const marketName = market ? getMarketName(market) : 'General';
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
          {/* Header with Leo + Sophia */}
          <div className="flex items-center gap-3 mb-4 mt-2">
            <button onClick={() => navigate('/practice')} className="w-9 h-9 rounded-xl bg-bg-2 border border-border flex items-center justify-center">
              <ArrowLeft size={16} className="text-text-primary" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-primary">Career Accelerator</h2>
              <p className="text-[11px] text-text-muted">{marketName} • Interview Prep</p>
            </div>
            <img src={leoGraduation} alt="Leo" className="w-10 h-10 rounded-full object-cover" />
            <img src={sophiaAvatar} alt="Sophia" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
          </div>

          {/* Industry Quick Selector */}
          <div className="mb-4 -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
              {markets.slice(0, 15).map(m => (
                <button key={m.id}
                  onClick={() => { setMarket(m.id); hapticFeedback("light"); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border",
                    market === m.id ? "bg-primary text-white border-primary" : "bg-bg-2 text-text-muted border-border hover:border-primary/30"
                  )}>
                  <span>{m.emoji}</span> {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'learn' && (
                <LearnTab
                  market={market || ''} marketName={marketName} path={path} stage={stage}
                  setStage={setStage} persona={persona} setPersona={setPersona}
                  mcqs={mcqs} currentMCQ={currentMCQ} mcqIndex={mcqIndex} mcqSelected={mcqSelected}
                  mcqScore={mcqScore} setMcqIndex={setMcqIndex} setMcqSelected={setMcqSelected} setMcqScore={setMcqScore}
                  mockPrompts={mockPrompts} currentMock={currentMock} mockIndex={mockIndex}
                  userResponse={userResponse} setUserResponse={setUserResponse}
                  feedback={feedback} setFeedback={setFeedback} submitting={submitting}
                  submitMock={submitMock} setMockIndex={setMockIndex}
                  framework={framework} bigBoss={bigBoss} mentalMath={mentalMath}
                  caseStudies={caseStudies} caseIndex={caseIndex} setCaseIndex={setCaseIndex}
                  caseTurn={caseTurn} setCaseTurn={setCaseTurn}
                  caseResponses={caseResponses} setCaseResponses={setCaseResponses}
                  caseInput={caseInput} setCaseInput={setCaseInput}
                  caseFeedback={caseFeedback} setCaseFeedback={setCaseFeedback}
                  caseSubmitting={caseSubmitting} submitCaseForFeedback={submitCaseForFeedback}
                  isProUser={isProUser} interviewLimit={interviewLimit}
                  user={user} navigate={navigate}
                />
              )}
              {activeTab === 'math' && <MentalMathEngine marketId={market || ''} />}
              {activeTab === 'frameworks' && <FrameworksLibrary marketId={market || ''} onFrameworkRead={handleFrameworkRead} />}
              {activeTab === 'glossary' && (
                <GlossaryAchievements
                  mathDrillsCompleted={mathDrillsCompleted}
                  notesSaved={notesSaved}
                  frameworksRead={frameworksRead}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-bg-0/95 backdrop-blur-xl border-t border-border z-50">
          <div className="max-w-lg mx-auto flex">
            {TABS.map(tab => (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); hapticFeedback("light"); }}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 transition-all",
                  activeTab === tab.key ? "text-primary" : "text-text-muted"
                )}>
                {tab.icon}
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Learn Tab (existing interview flow) ───
function LearnTab({ market, marketName, path, stage, setStage, persona, setPersona,
  mcqs, currentMCQ, mcqIndex, mcqSelected, mcqScore, setMcqIndex, setMcqSelected, setMcqScore,
  mockPrompts, currentMock, mockIndex, userResponse, setUserResponse,
  feedback, setFeedback, submitting, submitMock, setMockIndex,
  framework, bigBoss, mentalMath,
  caseStudies, caseIndex, setCaseIndex, caseTurn, setCaseTurn,
  caseResponses, setCaseResponses, caseInput, setCaseInput,
  caseFeedback, setCaseFeedback, caseSubmitting, submitCaseForFeedback,
  isProUser, interviewLimit, user, navigate,
}: any) {
  return (
    <div>
      <StageTracker current={stage} onTap={setStage} path={path} />

      <AnimatePresence mode="wait">
        {/* ─── STAGE 1: Framework ─── */}
        {stage === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-2 mb-3">
              <Layers size={18} className="text-primary" />
              <h3 className="text-base font-bold text-text-primary">MECE Framework</h3>
            </div>
            <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
              <p className="text-sm font-semibold text-text-primary mb-2">What is MECE?</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                <span className="font-bold text-primary">M</span>utually{' '}
                <span className="font-bold text-primary">E</span>xclusive,{' '}
                <span className="font-bold text-primary">C</span>ollectively{' '}
                <span className="font-bold text-primary">E</span>xhaustive — every item in ONE category, NO item left out.
              </p>
            </div>
            <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
              <p className="text-sm font-semibold text-text-primary mb-2">{marketName} Example</p>
              <p className="text-sm text-text-secondary mb-3">"{framework.label}"</p>
              <div className="space-y-2 mb-3">
                {framework.branches.map((b: string, i: number) => (
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
            <Button onClick={() => { hapticFeedback("light"); setStage(2); }} className="w-full bg-primary hover:bg-primary/90 text-white mt-2">
              Next: Expectations <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* ─── STAGE 2: Big Boss ─── */}
        {stage === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} className="text-amber-500" />
              <h3 className="text-base font-bold text-text-primary">Top "Big Boss" Questions</h3>
            </div>
            <p className="text-sm text-text-muted mb-4">Questions that separate good from great in {marketName}.</p>
            {bigBoss.map((q: any, i: number) => (
              <div key={i} className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                <div className="flex gap-3 mb-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{q.question}</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5">
                  <Zap size={12} className="text-amber-500 mt-0.5" />
                  <p className="text-xs text-text-secondary italic">{q.tip}</p>
                </div>
              </div>
            ))}
            {mentalMath.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-5 mb-3">
                  <Clock size={18} className="text-red-500" />
                  <h3 className="text-base font-bold text-text-primary">Mental Math Minute</h3>
                </div>
                {mentalMath.map((q: any, i: number) => (
                  <MathDrillCardInline key={i} question={q} />
                ))}
              </>
            )}
            <Button onClick={() => { hapticFeedback("light"); setStage(3); setMcqIndex(0); setMcqSelected(null); setMcqScore(0); }} className="w-full bg-primary hover:bg-primary/90 text-white mt-2">
              Next: Practice MCQs <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* ─── STAGE 3: MCQ ─── */}
        {stage === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-emerald-500" />
              <h3 className="text-base font-bold text-text-primary">Case Practice</h3>
            </div>
            <p className="text-sm text-text-muted mb-4">Question {mcqIndex + 1} of {mcqs.length}</p>
            <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
              <p className="text-sm font-semibold text-text-primary mb-4">{currentMCQ.question}</p>
              <div className="space-y-2">
                {currentMCQ.options.map((opt: string, i: number) => {
                  const selected = mcqSelected === i;
                  const correct = i === currentMCQ.correctIndex;
                  const revealed = mcqSelected !== null;
                  return (
                    <button key={i} disabled={revealed}
                      onClick={() => {
                        setMcqSelected(i);
                        hapticFeedback(i === currentMCQ.correctIndex ? "medium" : "heavy");
                        if (i === currentMCQ.correctIndex) setMcqScore((s: number) => s + 1);
                        if (user && market) {
                          supabase.from('interview_lab_attempts').insert({
                            user_id: user.id, market_id: market, path, stage: 3,
                            attempt_type: 'mcq', score: i === currentMCQ.correctIndex ? 100 : 0,
                            scenario_question: currentMCQ.question,
                          });
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left",
                        !revealed && "border-border hover:border-primary/50",
                        revealed && correct && "border-emerald-500 bg-emerald-500/5",
                        selected && !correct && "border-red-500 bg-red-500/5",
                      )}>
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
              <Button onClick={() => {
                hapticFeedback("light");
                if (mcqIndex < mcqs.length - 1) { setMcqIndex((i: number) => i + 1); setMcqSelected(null); }
                else setStage(4);
              }} className="w-full bg-primary hover:bg-primary/90 text-white">
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
                  <Mic size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-text-primary">Mock Lab with Sophia</h3>
                </div>
                {!feedback && (
                  <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                    <p className="text-sm font-semibold text-text-primary mb-2">Choose Your Persona</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(CONFIDENCE_PERSONAS) as [ConfidencePersona, typeof CONFIDENCE_PERSONAS[ConfidencePersona]][]).map(([key, p]) => (
                        <button key={key} onClick={() => { setPersona(key); hapticFeedback("light"); }}
                          className={cn("p-3 rounded-xl border-2 text-center transition-all",
                            persona === key ? "border-primary bg-primary/5" : "border-border")}>
                          <div className="flex justify-center mb-1">
                            {key === 'humble_leader' ? <Users size={20} className="text-primary" /> :
                              key === 'tech_genius' ? <Cpu size={20} className="text-primary" /> :
                                <Palette size={20} className="text-primary" />}
                          </div>
                          <span className={cn("text-[10px] font-medium", persona === key ? "text-primary" : "text-text-muted")}>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={sophiaAvatar} alt="Sophia" className="w-11 h-11 rounded-full object-cover border-2 border-primary" />
                    <div>
                      <p className="text-sm font-bold text-text-primary">Sophia Hernández</p>
                      <p className="text-[11px] text-text-muted">Case Interview Coach</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 mb-2">
                    <p className="text-sm text-text-secondary leading-relaxed">{currentMock.scenario}</p>
                  </div>
                  <p className="text-sm font-bold text-text-primary">{currentMock.question}</p>
                </div>
                {!feedback && (
                  <>
                    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
                      <p className="text-sm font-semibold text-text-primary mb-2">Your Response</p>
                      <textarea
                        className="w-full min-h-[160px] p-3 rounded-xl border-2 border-border bg-bg-1 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-primary focus:outline-none transition-colors"
                        placeholder="Type your answer here... Start with 'First, I would...' for structure."
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                      />
                      <VibeMeter text={userResponse} />
                    </div>
                    <Button onClick={submitMock} disabled={submitting || userResponse.trim().length < 20}
                      className="w-full bg-primary hover:bg-primary/90 text-white disabled:opacity-40">
                      {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Submit to Sophia <Send size={14} /></>}
                    </Button>
                  </>
                )}
                {feedback && (
                  <FeedbackDisplay feedback={feedback} sophiaAvatar={sophiaAvatar} leoGraduation={leoGraduation}
                    onRetry={() => { setFeedback(null); setUserResponse(''); }}
                    onNext={() => { setFeedback(null); setUserResponse(''); setMockIndex((i: number) => i + 1); }}
                    onContinue={() => setStage(5)}
                    continueLabel="Case Simulator"
                  />
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ─── STAGE 5: Case Study ─── */}
        {stage === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase size={18} className="text-primary" />
              <h3 className="text-base font-bold text-text-primary">Case Study Simulator</h3>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-white">
                <Crown size={8} /> PRO
              </span>
            </div>
            {!isProUser ? (
              <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-primary" />
                </div>
                <h4 className="text-base font-bold text-text-primary mb-2">Unlock Multi-Turn Cases</h4>
                <p className="text-sm text-text-muted mb-4">Practice McKinsey-style cases with Sophia guiding each turn.</p>
                <Button onClick={() => navigate('/subscription')} className="bg-primary text-white">
                  <Crown size={14} /> Upgrade to Pro
                </Button>
              </div>
            ) : caseStudies.length > 0 ? (
              <>
                <div className="grid gap-2 mb-4">
                  {caseStudies.map((cs: any, i: number) => (
                    <button key={cs.id}
                      onClick={() => { setCaseIndex(i); setCaseTurn(0); setCaseResponses([]); setCaseInput(''); setCaseFeedback(null); hapticFeedback("light"); }}
                      className={cn("bg-bg-2 rounded-xl p-3 border-2 text-left transition-all",
                        caseIndex === i ? "border-primary bg-primary/5" : "border-border")}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-text-primary">{cs.title}</p>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
                          cs.difficulty === 'beginner' ? "bg-emerald-500/10 text-emerald-600" :
                            cs.difficulty === 'intermediate' ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                        )}>{cs.difficulty}</span>
                      </div>
                      <p className="text-xs text-text-muted">{cs.summary}</p>
                    </button>
                  ))}
                </div>
                {caseStudies[caseIndex] && (
                  <div className="space-y-3">
                    {caseStudies[caseIndex].turns.slice(0, caseTurn + 1).map((turn: any, ti: number) => (
                      <div key={ti}>
                        <div className="bg-bg-2 rounded-2xl p-4 border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={sophiaAvatar} alt="Sophia" className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-bold text-primary">Sophia — Turn {ti + 1}</span>
                          </div>
                          <p className="text-sm text-text-secondary">{turn.prompt}</p>
                        </div>
                        {caseResponses[ti] && (
                          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 mt-2">
                            <p className="text-xs font-bold text-primary mb-1">Your Response</p>
                            <p className="text-sm text-text-primary">{caseResponses[ti]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {caseTurn < caseStudies[caseIndex].turns.length && !caseResponses[caseTurn] && (
                      <div className="space-y-2">
                        <textarea
                          className="w-full min-h-[120px] p-3 rounded-xl border-2 border-border bg-bg-1 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-primary focus:outline-none"
                          placeholder="Structure your response..."
                          value={caseInput}
                          onChange={(e) => setCaseInput(e.target.value)}
                        />
                        <VibeMeter text={caseInput} />
                        <Button disabled={caseInput.trim().length < 15}
                          onClick={() => {
                            const newResponses = [...caseResponses, caseInput];
                            setCaseResponses(newResponses);
                            setCaseInput('');
                            if (caseTurn + 1 < caseStudies[caseIndex].turns.length) setCaseTurn((t: number) => t + 1);
                            hapticFeedback("light");
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-white disabled:opacity-40">
                          {caseTurn + 1 < caseStudies[caseIndex].turns.length ? 'Submit & Next Turn' : 'Complete Case'} <Send size={14} />
                        </Button>
                      </div>
                    )}
                    {caseResponses.length >= caseStudies[caseIndex].turns.length && !caseFeedback && (
                      <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 text-center">
                        <Trophy size={32} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-base font-bold text-text-primary mb-1">Case Complete!</p>
                        <p className="text-sm text-text-muted mb-3">You navigated all {caseStudies[caseIndex].turns.length} turns.</p>
                        <Button onClick={submitCaseForFeedback} disabled={caseSubmitting} className="bg-primary text-white">
                          {caseSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Get AI Feedback <ChevronRight size={14} /></>}
                        </Button>
                      </div>
                    )}
                    {caseFeedback && (
                      <FeedbackDisplay feedback={caseFeedback} sophiaAvatar={sophiaAvatar} leoGraduation={leoGraduation}
                        onRetry={() => { setCaseFeedback(null); setCaseResponses([]); setCaseTurn(0); }}
                        onNext={() => { setCaseFeedback(null); setCaseResponses([]); setCaseTurn(0); setCaseIndex((i: number) => (i + 1) % caseStudies.length); }}
                        onContinue={() => setStage(6)}
                        continueLabel="Analytics"
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
                <p className="text-sm text-text-muted">No case studies for this industry yet.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── STAGE 6: Analytics ─── */}
        {stage === 6 && (
          <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <InterviewAnalytics userId={user?.id} marketId={market} path={path} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline Math Drill ───
function MathDrillCardInline({ question: q }: { question: { question: string; options: string[]; correctIndex: number; explanation: string } }) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected !== null;
  return (
    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
      <p className="text-sm font-semibold text-text-primary mb-3">{q.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, i) => (
          <button key={i} disabled={revealed}
            onClick={() => { setSelected(i); hapticFeedback(i === q.correctIndex ? "medium" : "heavy"); }}
            className={cn("p-2.5 rounded-xl border-2 text-sm font-semibold text-center transition-all",
              !revealed && "border-border hover:border-primary/50",
              revealed && i === q.correctIndex && "border-emerald-500 bg-emerald-500/5",
              selected === i && i !== q.correctIndex && "border-red-500 bg-red-500/5",
            )}>
            {opt}
          </button>
        ))}
      </div>
      {revealed && <p className="text-xs text-text-secondary mt-3">{q.explanation}</p>}
    </div>
  );
}

// ─── Feedback Display with Leo & Sophia ───
function FeedbackDisplay({ feedback, sophiaAvatar, leoGraduation, onRetry, onNext, onContinue, continueLabel }: {
  feedback: any; sophiaAvatar: string; leoGraduation: string;
  onRetry: () => void; onNext: () => void; onContinue: () => void; continueLabel: string;
}) {
  const score = feedback.score ?? 0;
  const isHighScore = score >= 80;

  return (
    <div className="space-y-3 mt-2">
      {/* Leo celebration for high scores */}
      {isHighScore && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-4">
          <img src={leoGraduation} alt="Leo celebrating" className="w-24 h-24 mx-auto mb-2 object-contain" />
          <p className="text-sm font-bold text-primary">Amazing work! 🎉</p>
        </motion.div>
      )}

      <div className="bg-bg-2 rounded-2xl p-4 border border-border flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-primary">{score}</span>
          <span className="text-[10px] text-text-muted">/100</span>
        </div>
        <div className="flex-1 space-y-1.5">
          <ScoreBar label="Structure" value={feedback.structureScore ?? 0} color="hsl(var(--primary))" />
          <ScoreBar label="Content" value={feedback.contentScore ?? 0} color="#3B82F6" />
          <ScoreBar label="Persona" value={feedback.personaScore ?? 0} color="#F59E0B" />
        </div>
      </div>

      <div className="bg-bg-2 rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-3">
          <img src={sophiaAvatar} alt="Sophia" className="w-10 h-10 rounded-full object-cover" />
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
        <div className="bg-bg-2 rounded-2xl p-4 border border-border border-l-4 border-l-primary">
          <p className="text-sm font-bold text-text-primary mb-2"><Lightbulb size={14} className="inline mr-1 text-primary" />Try Saying This</p>
          <p className="text-sm text-primary italic leading-relaxed">"{feedback.trySaying}"</p>
        </div>
      )}

      {((feedback.buzzwordsUsed?.length > 0) || (feedback.buzzwordsMissed?.length > 0)) && (
        <div className="bg-bg-2 rounded-2xl p-4 border border-border">
          <p className="text-sm font-bold text-text-primary mb-3"><Key size={14} className="inline mr-1" />Buzzword Detector</p>
          {feedback.buzzwordsUsed?.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] text-text-muted mb-1.5">Used</p>
              <div className="flex flex-wrap gap-1.5">
                {feedback.buzzwordsUsed.map((w: string) => (
                  <span key={w} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-[11px] text-emerald-600 font-medium">{w}</span>
                ))}
              </div>
            </div>
          )}
          {feedback.buzzwordsMissed?.length > 0 && (
            <div>
              <p className="text-[11px] text-text-muted mb-1.5">Missed</p>
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
        <Button variant="outline" onClick={onRetry} className="flex-1 border-primary text-primary">
          <RotateCcw size={14} /> Try Again
        </Button>
        <Button onClick={onNext} className="flex-1 bg-primary hover:bg-primary/90 text-white">
          Next Scenario <ChevronRight size={14} />
        </Button>
      </div>
      <Button variant="ghost" onClick={onContinue} className="w-full text-text-muted">
        Continue to {continueLabel} <ChevronRight size={14} />
      </Button>
    </div>
  );
}
