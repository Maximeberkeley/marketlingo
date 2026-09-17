# Leo in lessons: from hidden chat to a real study partner

Today Leo is a 32px round photo in the lesson header. Nothing tells people it can be tapped, and tapping it opens a plain chat sheet. Three problems to solve: discoverability, feeling premium, and being more useful than a blank text box.

## 1. Make it impossible to miss

- Replace the small circle with a labelled "Ask Leo" pill in the header (Leo's face + the word "Ask"), so it reads as a button.
- First two lessons only: a one-time hint bubble points at it — "Stuck? Tap me and I explain it your way." Dismisses on tap or after a few seconds, never returns.
- Leo offers help himself at the right moments, as a small tappable line under the card:
  - after a wrong answer: "Want me to explain why?"
  - when the learner sits on the same card unusually long: "This one's dense. Want it simpler?"
  - on the hardest beat of the lesson: "Ask me anything before you answer."
- Wrong-answer feedback footer gets an "Explain this" button that opens the chat with that question already asked, so the first message is Leo answering — not an empty screen.

## 2. Make it feel premium

- The sheet slides up over the lesson with a blurred, dimmed lesson behind it, keeping the card the learner is on visible at the top as a small "you're asking about…" strip. Context is visible, not implied.
- Leo's face animates by state: thinking, talking, celebrating — reusing the existing lesson mascot states instead of a static photo.
- Answers stream in word by word instead of appearing after a spinner, with a soft haptic when he starts talking.
- Consistent lesson visual language: same tokens, same rounded cards, same market accent colour, same short-copy rule (two short sentences per bubble, key terms coloured).
- Tap the speaker to hear it, tap again to stop — one clear control instead of the current small "▶".

## 3. Make it more than a chat

Modes shown as chips above the input, each one tap:

- **Explain simpler** — same idea at a lower level, with a real-world comparison.
- **Give an example** — a concrete company or number from the learner's industry, using the industry stats already in the app.
- **Why it matters** — how this shows up in a job, an interview, or an investment call.
- **Quiz me** — Leo asks 2 quick questions on this exact card and reacts; correct answers earn a small XP bonus, so asking for help is rewarded rather than penalised.

Plus:

- **Voice**: hold to talk instead of typing, since the app already has speech-to-text for the Interview Lab. Typing stays available.
- **Save to Notes**: any Leo answer can be saved into the existing notebook with the lesson attached, so help becomes revision material.
- **Continue where you left off**: the conversation persists for the whole lesson, so closing and reopening keeps the thread.

## 4. After the lesson

The completion screen shows "You asked Leo 3 things" and offers to save them to Notes. Anything he explained is queued into the review system so the confusing idea comes back later.

## Technical notes

- Header pill and hint live in `mobile/lesson-kit/components/LessonHeader.tsx`; proactive prompts are triggered from `LessonScreen.tsx` (wrong answer, dwell time) and rendered near `FeedbackFooter`.
- `AskLeoOverlay.tsx` is rebuilt: mode chips, streaming responses, `LeoCharacter` states, blur backdrop, persisted per-lesson message state lifted into `LessonScreen`, save-to-notes via the existing notebook insert path.
- Streaming requires the `leo-voice-chat` edge function to switch from a buffered response to a streamed one; the current model call stays, plus mode-specific system prompt additions and injected industry stats from `useIndustryContent`.
- "Quiz me" reuses the existing multiple-choice exercise component so it looks like the lesson, and grants XP through `usePracticeRewards`.
- Voice input reuses `interviewVoice` transcription; TTS keeps the current ElevenLabs path and its consent/kill-switch checks.
- No new paid surfaces, no dark mode, light appearance only.
