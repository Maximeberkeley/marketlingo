import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mic, MicOff, Save, CheckCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface BehavioralQuestion {
  id: string;
  question: string;
  category: string;
  tip: string;
  suggestedAnswer: string;
}

const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  { id: 'strengths', question: 'What are your strengths?', category: 'Behavioral and Personal Fit', tip: 'Highlight examples from your previous work and educational experience. Be specific, practical and self confident.', suggestedAnswer: 'I excel at breaking complex problems into structured components. For example, in my last role I restructured our data pipeline which reduced processing time by 40%.' },
  { id: 'weaknesses', question: 'What are your weaknesses?', category: 'Behavioral and Personal Fit', tip: 'Choose a genuine weakness and show what you\'re doing to improve. Avoid clichés like "I\'m a perfectionist."', suggestedAnswer: 'I sometimes spend too long on analysis before making decisions. I\'ve been working on setting time-boxed deadlines for research phases.' },
  { id: 'why-consulting', question: 'Why consulting?', category: 'Behavioral and Personal Fit', tip: 'Focus on problem-solving, variety of industries, steep learning curve, and working with smart teams.', suggestedAnswer: 'I\'m drawn to the variety of challenges — from market entry strategies to operational transformations. The steep learning curve and exposure to leadership teams is unmatched.' },
  { id: 'why-this-firm', question: 'Why this firm?', category: 'Behavioral and Personal Fit', tip: 'Research the firm specifically. Mention recent projects, culture, values, or people you\'ve spoken with.', suggestedAnswer: 'Your firm\'s focus on digital transformation aligns with my background. I spoke with Sarah Chen about the AI strategy practice and was impressed by the collaborative culture.' },
  { id: 'leadership', question: 'Tell me about a time you led a team.', category: 'Leadership', tip: 'Use the STAR method. Quantify your impact. Show how you motivated others.', suggestedAnswer: 'As VP of our investment club, I led 12 members through a live portfolio challenge. I established weekly standups and mentoring pairs, resulting in a 23% portfolio return over 6 months.' },
  { id: 'conflict', question: 'Describe a conflict you resolved.', category: 'Leadership', tip: 'Show empathy and active listening. Explain the resolution process and outcome.', suggestedAnswer: 'Two team members disagreed on market sizing methodology. I facilitated a structured debate, had each present evidence, and we combined the best elements of both approaches.' },
  { id: 'failure', question: 'Tell me about a time you failed.', category: 'Resilience', tip: 'Be honest. Focus 80% on what you learned and how you applied it later.', suggestedAnswer: 'I underestimated a project timeline by 3 weeks. I learned to build buffer time and conduct risk assessments upfront. On my next project, I delivered ahead of schedule.' },
  { id: 'achievement', question: 'What\'s your greatest achievement?', category: 'Resilience', tip: 'Choose something that demonstrates drive, impact, and growth. Quantify the result.', suggestedAnswer: 'Launching a student-run consulting project that partnered with 3 local businesses, generating $50K in recommendations implemented within 6 months.' },
  { id: 'pressure', question: 'How do you handle pressure?', category: 'Work Style', tip: 'Give a specific example. Show your process for prioritizing under stress.', suggestedAnswer: 'During finals and a case competition simultaneously, I created a strict schedule, delegated research tasks, and focused on high-impact deliverables first. We won second place.' },
  { id: 'creativity', question: 'Give an example of creative problem-solving.', category: 'Work Style', tip: 'Show unconventional thinking. Explain why your approach was unique.', suggestedAnswer: 'Our marketing budget was cut 60%. I proposed a referral program with gamification elements. It cost 1/10th of traditional ads and increased signups by 35%.' },
];

export function BehavioralQA({ marketId, userId }: { marketId: string; userId?: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedNotes, setSavedNotes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [listening, setListening] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load saved notes from Supabase
  useEffect(() => {
    if (!userId) return;
    supabase.from('notes').select('*').eq('user_id', userId).eq('linked_label', 'interview-qa')
      .then(({ data }) => {
        if (data) {
          const loaded: Record<string, string> = {};
          const saved = new Set<string>();
          data.forEach(n => {
            if (n.slide_id) { loaded[n.slide_id] = n.content; saved.add(n.slide_id); }
          });
          setNotes(loaded);
          setSavedNotes(saved);
        }
      });
  }, [userId]);

  const saveNote = async (qId: string) => {
    if (!userId || !notes[qId]?.trim()) return;
    setSaving(qId);
    hapticFeedback("medium");

    try {
      // Upsert: delete old, insert new
      await supabase.from('notes').delete().eq('user_id', userId).eq('linked_label', 'interview-qa').eq('slide_id', qId);
      await supabase.from('notes').insert({
        user_id: userId,
        content: notes[qId],
        linked_label: 'interview-qa',
        slide_id: qId as any, // Using slide_id field to store question ID
        market_id: marketId,
      });
      setSavedNotes(s => new Set([...s, qId]));
    } catch (err) {
      console.error('Save note error:', err);
    } finally {
      setSaving(null);
    }
  };

  const startListening = (qId: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNotes(prev => ({ ...prev, [qId]: (prev[qId] || '') + ' ' + transcript }));
    };

    recognition.onerror = () => { setListening(null); };
    recognition.onend = () => { setListening(null); };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(qId);
    hapticFeedback("light");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(null);
  };

  const categories = [...new Set(BEHAVIORAL_QUESTIONS.map(q => q.category))];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
          <MessageSquare size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">Interview Q&A</h3>
          <p className="text-xs text-text-muted">Behavioral & Personal Fit</p>
        </div>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed bg-bg-2 rounded-2xl p-4 border border-border">
        There are certain types of questions that are likely to come up in the Behavioral and Personal Fit part of the consulting interview. Tap each question to see pro tips and add your own personalized notes.
      </p>

      {categories.map(cat => (
        <div key={cat}>
          <div className="px-3 py-2 rounded-xl bg-emerald-500 inline-block mb-3">
            <span className="text-[11px] font-bold text-white">{cat}</span>
          </div>
          <div className="space-y-2">
            {BEHAVIORAL_QUESTIONS.filter(q => q.category === cat).map(q => (
              <div key={q.id} className="bg-bg-2 rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => { setExpandedId(expandedId === q.id ? null : q.id); hapticFeedback("light"); }}
                  className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-emerald-500">Q</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary flex-1">{q.question}</p>
                  {savedNotes.has(q.id) && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  <ChevronDown size={16} className={cn("text-text-muted transition-transform shrink-0", expandedId === q.id && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {expandedId === q.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        {/* Suggested Answer */}
                        <div className="bg-emerald-500/5 rounded-2xl p-3.5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-blue-500">A</span>
                            </div>
                            <span className="text-[11px] font-bold text-text-muted">Suggested Answer</span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">{q.suggestedAnswer}</p>
                        </div>

                        {/* Pro Tip */}
                        <div className="bg-amber-500/5 rounded-xl p-3">
                          <p className="text-[11px] font-bold text-amber-600 mb-1">💡 Pro Tip</p>
                          <p className="text-xs text-text-secondary">{q.tip}</p>
                        </div>

                        {/* Personal Note */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-text-muted">✏️ Your Note</span>
                            <button
                              onClick={() => listening === q.id ? stopListening() : startListening(q.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                                listening === q.id ? "bg-red-500 text-white animate-pulse" : "bg-bg-1 border border-border text-text-muted hover:text-primary"
                              )}>
                              {listening === q.id ? <><MicOff size={12} /> Stop</> : <><Mic size={12} /> Dictate</>}
                            </button>
                          </div>
                          <textarea
                            className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-bg-1 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-primary focus:outline-none transition-colors"
                            placeholder="Write your personalized answer..."
                            value={notes[q.id] || ''}
                            onChange={(e) => setNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            onClick={() => saveNote(q.id)}
                            disabled={saving === q.id || !notes[q.id]?.trim()}
                            className="mt-2 bg-primary hover:bg-primary/90 text-white text-xs">
                            {saving === q.id ? 'Saving...' : savedNotes.has(q.id) ? <><CheckCircle size={12} /> Saved</> : <><Save size={12} /> Save Note</>}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const TOTAL_BEHAVIORAL_QUESTIONS = BEHAVIORAL_QUESTIONS.length;
