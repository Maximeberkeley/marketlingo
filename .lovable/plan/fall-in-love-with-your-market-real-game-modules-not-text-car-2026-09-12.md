# Fall in love with your market — real game modules, not text cards

You're right. What exists today is a slideshow with a quiz stapled on. Duolingo doesn't win with paragraphs, it wins because every 8 seconds you *do* something with your hands and the app reacts. Brilliant wins because you discover the answer instead of being told it.

So this plan throws out "read a card, tap Continue" as the default and replaces it with **playable modules** built from the market content you already have (55k slides, 336 investment scenarios, 1,560 trainer scenarios, key players, news).

## The core shift

Today: `card → card → card → multiple choice → done`

New: every lesson is a **mixed set** drawn from a library of game modules. No two lessons feel the same. A lesson is 6-9 beats, each beat a different interaction, one idea each, never more than 12 seconds before your hands do something.

```text
BEAT 1  Cold open      one striking fact, one tap to react
BEAT 2  Game module    (drag / sort / swipe / build)
BEAT 3  Micro-insight  8 words, no paragraph
BEAT 4  Game module    (different mechanic)
BEAT 5  Boss beat      the day's real decision, with consequence
BEAT 6  Reward reveal  card-pack flip + cliffhanger for tomorrow
```

## Phase 1 — Build the game module library (the heart of this)

Nine new playable modules. Each is one screen, thumb-only, no reading walls, instant reaction with sound + haptics.

1. **Sort the Signal** — 5 headlines fly in; drag each into "Bullish / Bearish / Noise" buckets. Buckets glow and thump on drop. Wrong drops bounce back with a one-line reason.
2. **Build the Chain** — drag scrambled steps into the real supply chain / deal / approval sequence (e.g. lithium → cathode → cell → pack → car). Snapping into the right slot clicks like a puzzle piece; the chain animates end-to-end when complete.
3. **Company Face-Off** — two real players from your market appear as cards; swipe left/right on "who has the bigger moat here?". Reveals the real answer with one killer stat. Tinder-speed, builds recognition of the players.
4. **Beat the Clock Terms** — 30 seconds, terms fly up, tap the correct meaning. Timer bar drains, tempo music rises, +time for streaks. Pure dopamine loop.
5. **Number Sense** — slider guess: "How much does one aircraft engine cost?" You drag, then the real number counts up to its place. Closer = bigger reward. Teaches magnitudes, impossible to answer by elimination.
6. **Spot the Fake** — three statements about your market, one is subtly false. Tap the lie. Uses the plausible-error generation you already have for drills.
7. **Map the Market** — tap regions/nodes on a stylized market map (where the fabs are, where the routes run). Spatial memory, gorgeous, zero reading.
8. **Chart Read** — a shape appears, you drag the line where you think it went next, then the real line draws over yours. Wonderfully satisfying, teaches pattern intuition.
9. **The Call (boss beat)** — the day's decision scenario: pick your move, set your confidence, then watch consequences play out over 3 animated beats before the verdict. This replaces today's flat "make the call" modal.

Each module ships with: entrance animation, drag/tap physics, correct/wrong sound + haptic, and a one-line insight on resolve. No module ever shows more than ~25 words at once.

## Phase 2 — Make the lesson a composed experience

- **Beat sequencer**: a lesson builder picks modules based on the day's content type, what you got wrong before, and variety rules (never the same module twice in a row, always end on a boss beat).
- **Cold opens**: each lesson starts with one arresting fact about your market rendered full-bleed over its signature gradient — a magazine cover, not a bullet list.
- **Micro-insight cards**: where text is genuinely needed, it's max 2 lines, huge type, one idea, with the key term highlighted and tappable. Paragraph cards are deleted.
- **Momentum**: combo multiplier visible and alive (fire at 3+, screen-edge glow at 5+), XP counting up in the header as you play, halfway celebration.
- **Cliffhanger**: finish screen ends with tomorrow's hook ("Tomorrow: the deal nobody thought would clear").

## Phase 3 — Habit loop and belonging

- **Streak rescue**: evening at-risk state on Home, one-tap 60-second rescue round (pure Beat the Clock).
- **Comeback**: broken streak gets a warm 2-minute "your knowledge stayed" restart instead of a punishment screen.
- **Rival nudges**: "Maya is 42 XP ahead in Aerospace" on Home, from existing leaderboard views.
- **League drama**: Sunday reveal — full-screen promotion/relegation ceremony with animation.
- **Smart notifications**: personalized send time based on when you usually play, loss-aversion copy only at the 8pm at-risk moment.

## Phase 4 — Industry romance

- **Market worlds**: each of the 15 markets becomes a *place* — signature gradient, custom 3D art, its own sound signature on correct answers, its own module skins. Switching markets should feel like changing worlds.
- **Player cards**: the key players in your market become collectible cards you earn by encountering them in modules — a personal deck of the companies that matter, with one insider fact each.
- **Insider milestones**: days 7/30/90/180 unlock market-specific insider badges with a short ceremony and shareable art.
- **Sunday recap**: one screen — what happened in your market this week, what you learned, your rank, shareable.

## What this deliberately kills

- Paragraph cards in lessons.
- Yes/no and 4-option-text quizzes as the default interaction (multiple choice survives only as one module among nine).
- The flat "make the call" modal.
- Generic emoji and stock iconography — everything uses the insider aesthetic and custom art.

## Technical notes

- New modules live in `mobile/lesson-kit/modules/`, each conforming to the existing `ExerciseProps`/`ExerciseState` contract so the lesson scaffolding (progress, hearts, combo, feedback footer) works unchanged.
- Drag/physics use `react-native-gesture-handler` + `react-native-reanimated` (already in the stack); avoid layout-animating width with the native driver per existing constraints.
- The beat sequencer replaces the naive card generation in `mobile/components/slides/LessonKitReader.tsx`; content adapters turn existing slides, drills, key players and scenarios into module payloads — no schema changes for Phase 1-2.
- Sounds extend `mobile/lib/sounds.ts` (WAV via expo-av), haptics via `mobile/lib/haptics.ts`.
- Custom art generated per module and per market, stored in `mobile/assets/`.
- Phase 3-4 may add one table for league results and one for earned player cards, each with RLS + grants.
- App stays 100% free throughout; no purchase surfaces.

Phases ship independently. Phase 1 is the big one — that's where the fun actually gets built.
