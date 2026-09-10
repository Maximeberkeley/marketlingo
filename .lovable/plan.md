# Fix and level up: Industry Intel, Lessons, Leagues

Three areas, in this order. Intel is broken and gets fixed first, then the lesson experience gets rebuilt properly, then leagues get a real redesign.

---

## 1. Industry Intel — fix, then genuinely upgrade

### Fix the two bugs first

**Sophia (the AI) goes off screen.** The full-screen news view stacks its parts top to bottom with no scroll and no awareness of the phone's notch or home bar. As soon as Sophia answers and the text grows, the article title, the "Read Full Article" button and the dots get pushed past the bottom of the screen. Fix: rebuild that screen so the top and bottom areas are pinned inside the safe zone, and only the middle (Sophia, status, answer text) scrolls. Long answers scroll instead of shoving everything off screen.

**The first story doesn't load.** The top carousel only appears when there are more than 3 stories, images silently fall back to a flat colour block, and the fetch runs once with no retry when the news service is still warming up. Fix: always show the lead story, retry the fetch once on empty/failed results, show a real loading state per card, and fall back to an industry illustration instead of a blank rectangle when an image is missing.

### Then the upgrade that was promised

- A proper lead story that fills the width with the image, a readable impact tag, and one line of "why this matters for you".
- A cleaner reading sheet: bigger headline, real paragraph spacing, source and date where you expect them, no cramped 10px text.
- Sophia's voice conversation gets a visible transcript that scrolls, a clear speak/stop control, and a text fallback for when you don't want to talk.
- Swipe between stories with a smooth transition and a progress bar at the top, like stories.
- Save-to-notebook and the quiz sit as clear actions, not tiny grey icons.

---

## 2. Lessons — rebuild the redesign properly

The current version added stage labels ("Recall, Discover, Predict, Apply, Decide") on top of the old cards. That's why it feels only slightly better: the labels changed, the experience didn't.

What gets rebuilt:

- **One scene at a time, edge to edge.** No more small card floating in an empty screen. Each scene fills the screen with its own visual treatment per stage.
- **Every stage actually behaves differently.** Recall = quick memory check on yesterday. Discover = the concept with a visual and highlighted key terms. Predict = you commit to an answer before the explanation is revealed. Apply = a short scenario using what you just read. Decide = the real call, with consequences.
- **Real progress you can feel.** A top bar that fills as you move, the current stage named, XP ticking up, and key ideas collecting as small unlocked badges.
- **Feedback with weight.** Correct/incorrect states with colour, motion and sound; a short explanation grounded in the lesson, never generic filler.
- **A real ending.** A debrief screen: what you decided, what you proved you understood, one line to reuse tomorrow, and what's next.
- Content stays the same; only how it's presented and paced changes. Nothing is truncated, narration/notes/sources keep working.

---

## 3. Leagues — redesign

Today it's a coloured box with a tier name, a countdown, and a plain list of names. That's the "lame" part.

- **A real league header**: tier crest artwork, your rank shown large, XP gap to the person above you, and the week's countdown.
- **Zones you can see**: promotion, safe and relegation bands are visually separated with clear colour and labels, not a flat list.
- **Your row is pinned** so you always see yourself even when you're 20th.
- **Movement**: rank changes since yesterday shown with up/down indicators.
- **Payoff**: an end-of-week result moment when you're promoted or relegated, and a small badge kept on your profile.
- **Honest empty state**: when your industry's league is quiet, say so and show what earns you a place, instead of an empty list.

---

## Technical notes

- All work stays inside `/mobile`. No backend schema changes, no monetization changes.
- `mobile/components/home/ImmersiveNewsOverlay.tsx`: replace hardcoded `TOP_PADDING`/`BOTTOM_PADDING` with `useSafeAreaInsets`, wrap the center stage in a `ScrollView`, cap subtitle height, pin top/bottom bars.
- `mobile/components/home/DailyNews.tsx`: remove the `news.length > 3` gate on the featured lead, add a bounded retry to `fetchNews`, per-card image placeholders, restyle `ds`/`s` sheets for readable type scale.
- `mobile/components/slides/SlideReaderV2.tsx` + `LessonCampaign.tsx`: split into per-stage scene components with stable keys and directional transitions; keep completion, XP, minimum-time and review logic untouched.
- `mobile/app/friends.tsx` (LeagueTab), `mobile/components/social/LeagueCard.tsx`, `mobile/lib/leagues.ts`: new header, zone grouping, sticky self row, delta indicators. `useLeagues.ts` gains previous-rank tracking only.
- Verify on a small iPhone and a large iPhone: no clipped controls, no overlap, no blank first card.
