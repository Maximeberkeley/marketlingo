import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Crosshair,
  Flag,
  RotateCcw,
  Search,
  Sparkles,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { StageScene, STAGE_PALETTE, StageKey } from "./StageScene";

/* ── Lesson shape (mirrors the mobile curriculum fields) ───── */

export interface RecallStep {
  kind: "recall";
  prompt: string;
  answer: string;
}
export interface DiscoverStep {
  kind: "discover";
  headline: string;
  line: string;
  terms: string[];
}
export interface ChoiceStep {
  kind: "predict" | "apply" | "decide";
  prompt: string;
  options: { label: string; detail: string; correct?: boolean; consequence?: string }[];
}
export interface DebriefStep {
  kind: "debrief";
  decision: string;
  reuseLine: string;
  next: string;
}
export type LessonStep = RecallStep | DiscoverStep | ChoiceStep | DebriefStep;

export interface Lesson {
  title: string;
  dayNumber: number;
  steps: LessonStep[];
}

const STAGE_UI: Record<StageKey, { label: string; hint: string; Icon: typeof Zap }> = {
  recall: { label: "RECALL", hint: "Ten seconds. What stuck?", Icon: RotateCcw },
  discover: { label: "DISCOVER", hint: "One new idea", Icon: Search },
  predict: { label: "PREDICT", hint: "Call it before the answer", Icon: Crosshair },
  apply: { label: "APPLY", hint: "Real case, your move", Icon: Wrench },
  decide: { label: "DECIDE", hint: "This one has consequences", Icon: Flag },
  debrief: { label: "DEBRIEF", hint: "Take this with you", Icon: Sparkles },
};

const stageOf = (step: LessonStep): StageKey =>
  step.kind === "recall" ? "recall"
  : step.kind === "discover" ? "discover"
  : step.kind === "debrief" ? "debrief"
  : step.kind;

/* ── Experience ────────────────────────────────────────────── */

export function LessonExperience({ lesson, onExit }: { lesson: Lesson; onExit?: () => void }) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [xp, setXp] = useState(0);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  const step = lesson.steps[index];
  const stage = stageOf(step);
  const palette = STAGE_PALETTE[stage];
  const ui = STAGE_UI[stage];
  const progress = (index + 1) / lesson.steps.length;

  const advance = useCallback(() => {
    setChoice(null);
    setRevealed(false);
    setFlash(null);
    setIndex((i) => Math.min(i + 1, lesson.steps.length - 1));
  }, [lesson.steps.length]);

  const pick = useCallback(
    (i: number, correct?: boolean) => {
      if (choice !== null) return;
      setChoice(i);
      const good = correct !== false;
      setFlash(good ? "correct" : "wrong");
      if (good) setXp((x) => x + 15);
      window.setTimeout(() => setFlash(null), 700);
    },
    [choice]
  );

  const collect = useCallback((label: string) => {
    setIdeas((prev) => (prev.includes(label) ? prev : [...prev, label]));
  }, []);

  const feedback = useMemo(() => {
    if (choice === null || step.kind === "recall" || step.kind === "discover" || step.kind === "debrief") return null;
    const opt = step.options[choice];
    return { correct: opt.correct !== false, text: opt.consequence || opt.detail };
  }, [choice, step]);

  return (
    <div className="fixed inset-0 overflow-hidden text-white select-none">
      {/* 3D stage */}
      <StageScene stage={stage} choice={choice} />

      {/* Vignette + readability gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 15%, transparent 30%, ${palette.bg[0]}CC 75%, ${palette.bg[0]} 100%)`,
        }}
      />

      {/* Success / error flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            initial={{ opacity: 0 }}
            animate={{ opacity: flash === "correct" ? 0.35 : 0.3 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0"
            style={{ background: flash === "correct" ? "#22C55E" : "#EF4444" }}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 px-5 pt-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 backdrop-blur transition hover:bg-white/20"
            aria-label="Close lesson"
          >
            <X className="h-4 w-4" />
          </button>

          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 backdrop-blur"
            style={{ background: `${palette.key}26` }}
          >
            <ui.Icon className="h-3.5 w-3.5" style={{ color: palette.key }} />
            <span className="text-[11px] font-black tracking-[0.14em]" style={{ color: palette.key }}>
              {ui.label}
            </span>
          </div>

          <span className="hidden flex-1 truncate text-xs font-medium text-white/60 sm:block">{ui.hint}</span>

          <div className="ml-auto flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <motion.span key={xp} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-sm font-black">
              {xp}
            </motion.span>
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full"
            style={{ background: palette.key }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        {ideas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ideas.slice(-4).map((idea) => (
              <motion.div
                key={idea}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="flex max-w-[46%] items-center gap-1.5 rounded-lg border px-2 py-1 backdrop-blur"
                style={{ borderColor: `${palette.key}66`, background: `${palette.key}1F` }}
              >
                <Check className="h-3 w-3 shrink-0" style={{ color: palette.key }} />
                <span className="truncate text-[10px] font-bold text-white/85">{idea}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Scene content */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="mx-auto w-full max-w-xl"
          >
            {step.kind === "recall" && (
              <div className="space-y-4">
                <p className="text-center text-2xl font-black leading-tight">{step.prompt}</p>
                <button
                  onClick={() => {
                    if (revealed) {
                      collect(step.answer.slice(0, 28));
                      setXp((x) => x + 10);
                      advance();
                    } else setRevealed(true);
                  }}
                  className="w-full rounded-3xl border border-white/15 bg-white/95 p-6 text-center text-slate-900 shadow-2xl transition active:scale-[0.98]"
                >
                  {revealed ? (
                    <span className="text-lg font-bold">{step.answer}</span>
                  ) : (
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Tap to reveal</span>
                  )}
                </button>
                {revealed && <p className="text-center text-xs text-white/50">Tap again to bank it</p>}
              </div>
            )}

            {step.kind === "discover" && (
              <div className="space-y-4">
                <h2 className="text-3xl font-black leading-tight">{step.headline}</h2>
                <p className="text-base leading-relaxed text-white/75">{step.line}</p>
                <div className="flex flex-wrap gap-2">
                  {step.terms.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur"
                      style={{ background: `${palette.key}26`, color: palette.key }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <PrimaryButton
                  color={palette.key}
                  onClick={() => {
                    collect(step.headline);
                    advance();
                  }}
                >
                  Got it
                </PrimaryButton>
              </div>
            )}

            {(step.kind === "predict" || step.kind === "apply" || step.kind === "decide") && (
              <div className="space-y-4">
                <p className="text-xl font-black leading-snug">{step.prompt}</p>
                <div className={step.kind === "decide" ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
                  {step.options.map((opt, i) => {
                    const isPicked = choice === i;
                    const dim = choice !== null && !isPicked;
                    return (
                      <motion.button
                        key={opt.label}
                        onClick={() => pick(i, opt.correct)}
                        whileTap={{ scale: 0.96 }}
                        animate={
                          step.kind === "decide" && choice === null
                            ? { boxShadow: [`0 0 0 0 ${palette.key}00`, `0 0 30px 0 ${palette.key}66`, `0 0 0 0 ${palette.key}00`] }
                            : {}
                        }
                        transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.3 }}
                        className="rounded-2xl border p-4 text-left backdrop-blur transition"
                        style={{
                          borderColor: isPicked ? palette.key : "rgba(255,255,255,0.18)",
                          background: isPicked ? `${palette.key}33` : "rgba(255,255,255,0.08)",
                          opacity: dim ? 0.35 : 1,
                        }}
                      >
                        <span className="block text-sm font-black">{opt.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-white/60">{opt.detail}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: feedback.correct ? "#22C55E66" : "#EF444466",
                        background: feedback.correct ? "#22C55E1F" : "#EF44441F",
                      }}
                    >
                      <p className="text-xs font-black tracking-widest" style={{ color: feedback.correct ? "#4ADE80" : "#FCA5A5" }}>
                        {feedback.correct ? "GOOD CALL" : "COSTLY CALL"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-white/85">{feedback.text}</p>
                      <PrimaryButton
                        color={palette.key}
                        className="mt-3"
                        onClick={() => {
                          collect(step.prompt.slice(0, 26));
                          advance();
                        }}
                      >
                        Continue
                      </PrimaryButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step.kind === "debrief" && (
              <div className="space-y-4 text-center">
                <p className="text-xs font-black tracking-[0.2em] text-white/50">MISSION COMPLETE</p>
                <h2 className="text-3xl font-black leading-tight">{step.decision}</h2>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur">
                  <p className="text-[10px] font-black tracking-widest text-amber-300">USE THIS TOMORROW</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/85">{step.reuseLine}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm font-bold">
                  <Zap className="h-4 w-4 text-amber-300" />
                  {xp} XP earned · {ideas.length} ideas banked
                </div>
                <PrimaryButton color={palette.key} onClick={onExit}>
                  Next: {step.next}
                </PrimaryButton>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  color,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  color: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-black text-slate-950 shadow-xl ${className}`}
      style={{ background: color }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </motion.button>
  );
}
