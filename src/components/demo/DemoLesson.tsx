import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Stage = 0 | 1 | 2 | 3;
const words = [
  { word: "torque", chance: "92%" },
  { word: "music", chance: "5%" },
  { word: "engine", chance: "1%" },
];
const answers = [
  "It plans an outline of the conclusion before writing word one.",
  "It calculates backwards from the final answer to the prompt.",
  "It has zero idea how the sentence ends until it generates the final word.",
  "It selects a complete pre-written answer from memory.",
];

interface DemoLessonProps {
  onSignUp: () => void;
  onClose: () => void;
}

export function DemoLesson({ onSignUp, onClose }: DemoLessonProps) {
  const [stage, setStage] = useState<Stage>(0);
  const [word, setWord] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState(false);

  useEffect(() => {
    localStorage.setItem("ml_demo_seen", "true");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const next = (step: Stage) => {
    setStage(step);
    document.querySelector(".website-demo-content")?.scrollTo({ top: 0 });
  };

  return (
    <div className="website-demo fixed inset-0 z-[200] flex flex-col bg-background text-foreground" role="dialog" aria-modal="true" aria-label="Demo lesson">
      <header className="shrink-0 border-b border-border bg-background pt-safe">
        <div className="mx-auto flex max-w-xl items-start gap-4 px-5 pb-3 pt-4">
          <div className="grid flex-1 grid-cols-3 gap-2" aria-label={`Step ${Math.min(stage + 1, 3)} of 3`}>
            {["Step 1", "Step 2", "Quiz"].map((label, index) => (
              <div key={label} className="min-w-0">
                <div className={`h-1.5 rounded-full ${index <= stage ? "bg-primary" : "bg-secondary"}`} />
                <span className={`mt-1 block text-center text-xs font-semibold ${index === stage ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close demo lesson" onClick={onClose} className="-mt-2 shrink-0"><X size={20} /></Button>
        </div>
      </header>

      <main className="website-demo-content min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-xl px-5 pb-10 pt-6">
          {stage === 0 && <>
            <span className="website-demo-tag">HOW AI ACTUALLY WORKS</span>
            <p className="website-demo-eyebrow">THE NEXT-TOKEN MACHINE · CONCEPT 1/3</p>
            <h1 className="website-demo-title">What is an LLM doing right now?</h1>
            <div className="website-demo-visual" aria-hidden="true"><span>THE</span><span>INSTANT</span><span className="website-demo-visual-focus">?</span></div>
            <div className="website-demo-panel">
              <p className="website-demo-label">PREDICT THE NEXT WORD</p>
              <p className="text-xl font-bold leading-snug">“The best thing about an electric car is the instant…”</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {words.map((item) => <Button key={item.word} variant="outline" aria-pressed={word === item.word} onClick={() => setWord(item.word)} className={`website-demo-word h-auto min-h-16 flex-col gap-1 px-1 py-2 ${word === item.word ? "border-primary bg-primary/10 text-primary" : ""}`}><strong>{item.word}</strong><span className="text-xs opacity-70">{item.chance}</span></Button>)}
              </div>
            </div>
            {word && <div className="website-demo-takeaway">AI models are not searching databases. They are mathematical prediction engines calculating the most likely next word fragment.</div>}
            <Button className="website-demo-next" disabled={!word} onClick={() => next(1)}>Continue <ArrowRight size={18} /></Button>
          </>}

          {stage === 1 && <>
            <span className="website-demo-tag">THE SECRET SAUCE</span>
            <p className="website-demo-eyebrow">THE ATTENTION SPARK · CONCEPT 2/3</p>
            <h1 className="website-demo-title">How does it understand context?</h1>
            <div className="website-demo-panel mt-7">
              <p className="text-xl font-bold leading-relaxed">The <span className={revealed ? "text-primary underline decoration-primary" : ""}>trophy</span> didn't fit in the suitcase because <Button variant="outline" onClick={() => setRevealed(true)} className="mx-1 inline-flex h-9 border-primary px-2 font-extrabold text-primary">IT</Button> was too big.</p>
              {revealed && <div className="mt-5 flex items-center gap-3 border-t border-border pt-5 font-bold text-primary"><Link2 size={19} /> IT connects to trophy</div>}
              {!revealed && <p className="mt-5 text-sm text-muted-foreground">Tap “IT” to reveal the connection.</p>}
            </div>
            {revealed && <div className="website-demo-takeaway">Older algorithms forgot earlier words. Modern Transformers use self-attention to map relationships between words, giving AI the appearance of reasoning.</div>}
            <Button className="website-demo-next" disabled={!revealed} onClick={() => next(2)}>Ready for the Test <ArrowRight size={18} /></Button>
          </>}

          {stage === 2 && <>
            <span className="website-demo-tag">MIND-BLOWN TEST</span>
            <p className="website-demo-eyebrow">ONE LAST PREDICTION</p>
            <h1 className="website-demo-title">When an AI writes a 500-word essay, when does it decide how the final sentence will conclude?</h1>
            <div className="mt-7 space-y-2.5">
              {answers.map((answer, index) => <Button key={answer} variant="outline" disabled={correct} onClick={() => { if (index === 2) { setCorrect(true); setWrongAnswer(null); } else setWrongAnswer(index); }} className={`website-demo-answer h-auto min-h-16 w-full justify-start gap-3 whitespace-normal py-3 text-left ${correct && index === 2 ? "border-primary bg-primary/10" : wrongAnswer === index ? "border-destructive bg-destructive/10" : ""}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{String.fromCharCode(65 + index)}</span><span className="flex-1">{answer}</span>{correct && index === 2 && <CheckCircle2 className="shrink-0 text-primary" size={20} />}</Button>)}
            </div>
            {wrongAnswer !== null && !correct && <div className="website-demo-takeaway">Not quite. Think smaller: what does the model choose at each single moment?</div>}
            {correct && <div className="website-demo-takeaway"><strong>Aha!</strong> It has no foresight. AI generates forward, one token at a time.</div>}
            <Button className="website-demo-next" disabled={!correct} onClick={() => next(3)}>Claim My Starting Reward <ArrowRight size={18} /></Button>
          </>}

          {stage === 3 && <div className="website-demo-finish">
            <div className="website-demo-award"><CheckCircle2 size={46} /></div>
            <p className="website-demo-eyebrow text-center">FIRST WIN</p>
            <h1 className="website-demo-title text-center">You just learned how modern AI thinks.</h1>
            <div className="website-demo-panel mt-7 flex justify-around text-center"><div><strong className="block text-2xl text-primary">+20 XP</strong><span className="text-sm text-muted-foreground">In the app</span></div><div><strong className="block text-2xl text-primary">1 Day</strong><span className="text-sm text-muted-foreground">Starting streak</span></div></div>
            <p className="mt-5 text-center text-sm text-muted-foreground">Install the app to save your progress and choose an industry.</p>
            <Button className="website-demo-next" onClick={onSignUp}>Get the App <ArrowRight size={18} /></Button>
            <Button variant="ghost" className="mt-3 w-full" onClick={onClose}>Back to website</Button>
          </div>}
        </div>
      </main>
    </div>
  );
}
