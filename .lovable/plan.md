# Phase 4 — Market Worlds, Collectibles, and Universal Lesson Kit

## Goal
Make each of MarketLingo’s 15 industries feel like a distinct world, reward learning with collectible industry-archetype cards and meaningful milestone badges, and ensure every lesson-like experience uses the new Lesson Kit.

## 1. Build the 15 market worlds
- Create one centralized world definition for aerospace, agtech, AI, biotech, clean energy, climate tech, cybersecurity, EV, fintech, healthtech, logistics/retail, neuroscience, robotics, spacetech, and web3.
- Give each world a distinct name, color system, visual motif, vocabulary, Leo role, progress title, existing market artwork, and collectible set identity.
- Apply the active world consistently to Home, Courses/Roadmap, Lesson Kit, lesson completion, collection, achievements, and profile without changing app navigation.
- Reuse the existing market illustrations and hero art, adding native layered effects and restrained animation so worlds feel rich without increasing download size heavily.

## 2. Add collectible industry-archetype cards
- Create four original archetypes per market (60 cards total), such as Systems Architect, Deal Maker, Mission Controller, or Supply Chain Operator—never real people or third-party brands.
- Each card will have a market-specific frame, rarity, role, specialty, short insider insight, and three learning stats.
- Add a Collection screen with market filtering, owned/locked states, card detail, set completion, and a featured-card slot on the profile.
- Add a reveal ceremony after earning a card, with Leo, haptics, sound, rarity treatment, and a duplicate-safe grant.

## 3. Add hybrid unlocks and insider milestone badges
- Award cards through a deterministic hybrid system: first lesson, lesson-count milestones, accuracy/mastery, streaks, boss decisions, and major journey days.
- Add market-specific badges for days 7, 30, 60, 90, 120, and 180, plus mastery and flawless-run badges.
- Show upcoming unlock progress on lesson completion, the collection, achievements, and profile.
- Keep rewards fair and explain exactly why each item unlocked; no random paid packs, currency, or monetization.

## 4. Make rewards secure and persistent
- Add a public collectible catalog and owner-only collections/milestones in the backend, with explicit grants and row-level access controls.
- Grant rewards only through a deterministic server-side function using authenticated progress data; the app cannot self-award cards or badges.
- Add idempotent reward-source keys so replaying completion events cannot mint duplicates.
- Keep existing achievements compatible while routing new Phase 4 grants through the secure reward service.

## 5. Implement Lesson Kit everywhere lesson content is taught
- Keep Home and Roadmap on `LessonKitReader`, and remove the two unused legacy slide readers.
- Adapt Trainer, Games, Drills, Investment scenarios, and Seminar Prep into Lesson Kit exercises using their real existing industry content and existing completion callbacks.
- Preserve specialized mechanics by exposing them as Lesson Kit modules rather than flattening them into generic paragraphs or yes/no cards.
- Route linked lesson content from Notebook/Summaries back through the same Lesson Kit path.
- Keep Interview chat, portfolio/watchlist tools, seminar video playback, and other non-lesson utilities specialized; only their instructional exercise sequences use Lesson Kit.

## 6. Connect world progression to every lesson
- Pass market-world identity into the lesson header, Leo coach, module accents, feedback, and completion ceremony.
- Evaluate unlocks exactly once after a verified lesson/activity completion.
- On completion, show XP, mastery movement, badge progress, and a card reveal when earned.
- Keep the “two short sentences per beat” rule, semantic colored figures/trends, real industry statistics, and Leo’s industry-backed coaching throughout.

## 7. Validate the full experience
- Test all 15 world definitions and representative cards for missing artwork, contrast, long text, and small-screen overflow.
- Test first lesson, milestone, mastery, streak, repeat completion, duplicate prevention, locked/owned collection states, and cross-market isolation.
- Walk every learning entry point and confirm no legacy lesson reader remains reachable.
- Run focused TypeScript/build checks and verify the mobile flows used for Xcode release.

## Technical details
- Frontend scope: `mobile/lesson-kit/**`, market-world configuration, collection/reward screens and components, relevant Home/Roadmap/Profile/Achievements surfaces, plus adapters for existing learning modes.
- Backend scope: additive catalog/ownership/milestone tables and secure reward-evaluation function; no destructive schema changes.
- Existing real industry packs, statistics, trainer scenarios, drill questions, market art, XP, haptics, sounds, and Leo assets remain the source material.
- App remains completely free with no purchase or pack-selling surface.
