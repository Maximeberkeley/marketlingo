# Layered Lesson Reading System

## Goal
Keep every lesson and case visually light on first view while preserving the complete human-authored material behind intuitive taps. Use the selected **contained scroll briefing** direction, the current MarketLingo colors and graphics, and a friendly Outfit/Figtree reading hierarchy.

## What is happening now
- The case brief places the full scenario into a large-display treatment, then cuts it at 140 characters, producing the dead-end ellipsis shown in the screenshot.
- Lesson insights and feedback also hard-cut text at roughly 80–150 characters. The hidden remainder cannot be reopened.
- Each source slide contains more authored text than the live lesson retains: the lesson builder currently keeps only the first one or two qualifying sentences.
- Learning objectives and recap material are already available but are not consistently used in the lesson flow.

## Build

### 1. Add one reusable reading layer
Create a shared mobile **Briefing Reader** that receives:
- a concise lead;
- the complete original text;
- optional highlighted figures and terms;
- optional sections, sources, and a contextual action.

The first layer stays short and graphic. A clear `Read briefing` control opens a focused reading sheet with:
- 17px minimum body text and comfortable line height;
- a visible scroll cue and reading progress;
- paragraph-level spacing rather than one oversized block;
- highlighted numbers and important terms;
- expandable term definitions and tappable sources;
- `Done` returning to the exact lesson position.

No information will be hidden behind an unexplained ellipsis, and expanded text will never shrink to fit.

### 2. Fix Deep Case first
Match the selected direction on the screenshot’s Brief stage:
- preserve the four-stage rail, Leo, dark-grey surfaces, and purple primary action;
- replace the oversized truncated scenario with a concise case lead at a readable display size;
- add an obvious depth cue showing that the complete briefing is available;
- open the contained full briefing before the learner starts Evidence;
- keep `Open the case` reachable without making the full page visually dense.

The same reader will support the longer scenario, professional reasoning, common mistake, and mental model during the final debrief.

### 3. Preserve complete lesson content
Extend lesson beats so each short teaching moment keeps a reference to its full source text instead of discarding it.
- Micro insights remain one clear idea on the main screen.
- `Go deeper` opens the full slide in the Briefing Reader.
- Key terms expand in place with one tap.
- Sources remain attached to the detailed text they support.
- Learning objectives appear before the lesson; recap material appears at the end.
- Feedback keeps one concise explanation visible, with the complete reasoning available through the same reading pattern.

### 4. Make interactions informative, not decorative
Use the current visual system and add purposeful micro-interactions:
- highlighted figures can be tapped for context;
- terms unfold definitions in place;
- diagrams, evidence rows, and consequences reveal in meaningful steps;
- Leo’s existing bubble becomes the entry to deeper explanation where appropriate, avoiding another competing button row;
- short haptics and smooth height/opacity transitions confirm each reveal.

### 5. Typography and accessibility
- Use the selected friendly hierarchy: Outfit for headings and Figtree for reading text where the mobile font setup supports it; otherwise preserve the closest existing bundled weights without adding a startup dependency.
- Keep body text at least 16–17px and secondary instructional text at least 13px.
- Support device font scaling, long words, small iPhones, dark mode, reduced motion, and screen readers.
- Keep all controls reachable with one thumb and provide explicit labels such as `Read briefing`, `Show definition`, and `Done`.

## Scope
Apply this system to the content-heavy mobile surfaces that share the lesson engine:
- daily lessons;
- Deep Case;
- Arena/passive teaching beats;
- answer feedback and final case debriefs.

Do not redesign Home, navigation, rewards, Leo artwork, or business logic.

## Technical notes
- Extend the lesson exercise model with full-detail fields while retaining short lead text.
- Change the content extractors to preserve full slide bodies, unused supporting sentences, terms, and sources.
- Reuse the existing short-text utilities only for the first layer; never pass full-reader copy through truncation.
- Build the reader once and consume it from passive beats, case briefs, and feedback.
- Keep existing scoring, XP, hearts, back navigation, notes, and Ask Leo state unchanged.

## Validation
- Test short and very long aerospace, finance, tech, and retail content.
- Confirm no authored body text is silently discarded between source data and the detailed reader.
- Verify Deep Case against the uploaded screenshot at small and large iPhone sizes in light and dark modes.
- Test nested scrolling, reopening/closing details, returning to the same beat, font scaling, sources, back navigation, and no duplicate XP.
- Run mobile type checks and confirm the preview build remains clean.
