# MarketLingo Lesson Experience Redesign

## Goal
Turn every mobile lesson into a smooth, premium learning game where users always understand:
- what they are about to learn;
- where they are in the lesson;
- why the concept matters;
- how to use it immediately;
- what they have mastered by the end.

The selected direction is a **Gamified Learning Path** using MarketLingo’s current light palette and purple identity, with **Archivo Black-style display headings and Hind body typography**.

## New lesson rhythm

```text
MISSION BRIEF
    ↓
RECALL — connect yesterday to today
    ↓
DISCOVER — one focused concept at a time
    ↓
PREDICT — commit before seeing the answer
    ↓
APPLY — short scenario, match, sequence, or diagnosis
    ↓
MAKE THE CALL — consequential real-world decision
    ↓
DEBRIEF — what changed, what to remember, what comes next
```

### 1. Mission briefing and route
- Replace the generic opening cards with one compact mission screen.
- Show the lesson promise, an immediately useful capability, estimated duration, and a curved route of 4–6 meaningful checkpoints.
- Use the existing mentor artwork for one contextual briefing line—not random encouragement.
- Let the learner start immediately; the route remains accessible as a compact progress view during the lesson.

### 2. Focused learning scenes
- Replace the repeated “card inside a blank screen” presentation with edge-to-edge lesson scenes and a stable bottom action area.
- Give each scene a clear role label such as **Observe**, **Understand**, **Predict**, or **Apply**.
- Preserve full lesson text, sources, narration, notes, and accessibility, but improve hierarchy with short readable sections, highlighted key terms, and visual examples.
- Keep the current colors while introducing stronger depth, tactile controls, and industry-specific accents/imagery already available in the app.

### 3. Deliberate interactions instead of random interruptions
- Remove position-based mascot interstitials from the lesson sequence.
- Show mentor guidance only when it reacts to a learner action, explains a misconception, frames a decision, or summarizes a result.
- Replace generic generated distractors such as “the opposite…” with content-grounded checks. If a slide cannot produce a credible challenge, show no challenge rather than a weak one.
- Keep and visually unify quizzes, word matching, flashcards, and the Decision Engine under one interaction language.
- Add lightweight “commit first, reveal second” moments so learners actively predict outcomes before reading explanations.

### 4. Persistent knowledge console
- Build a compact top display with close control, segmented route progress, current stage, and earned XP.
- Show collected key ideas as small “knowledge unlocks” without blocking the lesson.
- Ensure the map, current scene, feedback, and bottom action never overlap on small iPhones or larger iPads.

### 5. End-of-lesson payoff
- Make “Make the Call” the visible destination from the opening route and transition into it without blinking.
- Redesign completion as a debrief: decision result, concepts demonstrated, one reusable takeaway, accuracy, and tomorrow’s destination.
- Keep existing completion, review, minimum-time, XP, notes, and progress behavior unchanged.

## Content strategy
- Keep the existing curriculum and source material as the foundation.
- Derive a clear mission promise and checkpoint labels from lesson metadata and slide content.
- Use deterministic fallback copy when metadata is absent; never insert random motivational filler.
- Add new copy only for instructional framing, grounded answer feedback, and real-world application prompts.
- Start by making the first lessons exemplary, while ensuring the renderer gracefully upgrades all existing lessons without requiring immediate database rewrites.

## Motion and feedback
- Use directional transitions that make forward/back movement obvious.
- Add tactile press depth, progress fills, correct/incorrect feedback, and restrained checkpoint celebrations.
- Respect reduced-motion settings and prevent duplicate loads, layout shifts, flashes, or modal blinking.

## Technical implementation
- Refactor `SlideReaderV2` into a scene orchestrator with explicit stages and stable keys.
- Add reusable mission-map, lesson-status, focused-scene, knowledge-unlock, and debrief presentation components.
- Consolidate exercise chrome so all activities share spacing, states, controls, and feedback behavior.
- Replace random runtime ordering/messages with stable lesson-derived data.
- Load the selected fonts locally through the mobile font system, with safe fallbacks while fonts initialize.
- Keep all changes inside `/mobile`; no payment, access-control, or backend changes.

## Validation
- Test a short first-day lesson, a long technical lesson, review mode, Quick Bites, and the final Decision Engine handoff.
- Verify completion and XP are awarded once, notes/sources/narration still work, and no content is truncated.
- Check small iPhone and iPad layouts, long words, large text settings, reduced motion, swipe/back behavior, and interruption recovery.
- Confirm the lesson can be completed end-to-end without blinking, dead ends, clipped controls, or overlapping text.
