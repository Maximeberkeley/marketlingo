# Fix the lesson screen and make it genuinely game-like

You're right — the current lesson screen is worse, not better. Your screenshots show cards that are almost empty, a card whose text just repeats its own title, a card that only shows "Sources:", and a lot of blank space with no sense of progress or reward. On top of that, none of the psychology from your research is actually present in the flow.

## Part 1 — Fix what's broken (must happen first)

1. **No empty cards.** Any card with no real text is dropped before the lesson starts. A card that only carries sources gets merged into the card above it.
2. **No repeated text.** When the body text is the same as the title (or nearly the same), show it once.
3. **Titles only where they belong.** The lesson name stays in the top bar; each card shows its own heading, not the lesson name again.
4. **No "Key terms for this lesson" with nothing under it.** Term cards only appear when there are terms, and each term shows word + plain-language meaning.
5. **Fill the screen properly.** Content sits from the top, grows into the space, and scrolls when long — instead of one line floating above an empty half-screen.
6. **Real quiz questions.** The auto-made questions are checked for a valid question, 3-4 distinct answers, and one correct answer; if they don't pass, no question is shown rather than a broken one.

## Part 2 — Build the addictive loop from your research

**Instant feedback (dopamine hit).** Every answer produces an immediate reaction: the answer turns green or red, a chime plays, the phone vibrates, and a short explanation appears in a bottom banner before you continue. Correct answers pop a small "+XP" that flies into the progress bar.

**Visible progress every tap.** The top bar fills smoothly with each card, with a small burst of animation on each step so progress feels earned.

**Streak in the lesson.** A combo counter appears after 2 correct answers in a row ("3 in a row!") and grows; breaking it visibly resets it. Ending the lesson feeds the daily streak, which is shown on the finish screen with the day count.

**Loss aversion at the exit.** Tapping the X mid-lesson asks: leave now and you lose this lesson's progress and risk your streak. One tap to stay, one to leave.

**Bite-sized and low commitment.** Each card is one idea. The finish screen shows how long it took ("done in 2 min 40") so the next session feels cheap to start.

**Variable reward at the end.** The finish screen opens a reward: a base XP amount plus a bonus that varies with accuracy and combo (perfect run, no-mistake bonus, speed bonus), revealed with a short animation so the amount isn't fully predictable.

**Social pull.** The finish screen shows XP earned, the new weekly total, and current league position with the nearest rival above you ("42 XP from passing Maya"), linking to the leaderboard.

**Hearts, gently.** Three hearts per lesson; a wrong answer costs one; running out offers a retry of the missed questions rather than kicking you out. Nothing is paywalled — the app stays fully free.

## Technical notes

- Card generation moves into a validated builder in `mobile/components/slides/LessonKitReader.tsx`: filter empty/duplicate content, merge source-only cards, validate quizzes before emitting exercises.
- `mobile/lesson-kit/screens/LessonScreen.tsx` gains combo state, hearts, exit-confirmation modal, XP-fly animation and per-answer haptics/sound via the existing `mobile/lib/haptics.ts` and `mobile/lib/sounds.ts`.
- `mobile/lesson-kit/screens/LessonComplete.tsx` gains the reward reveal (base + variable bonus), time spent, streak day, and league/rival row sourced from the existing XP and leaderboard hooks.
- `mobile/lesson-kit/exercises/InfoCard.tsx` layout fixed to top-aligned, scrollable, full-width; term cards render term/definition pairs.
- Visuals stay on `mobile/lesson-kit/theme/tokens.ts`; XP writes keep going through the existing hooks — no scoring logic changes.

No changes to backend data, monetization, or the news feed.
