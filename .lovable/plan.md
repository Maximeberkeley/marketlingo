# Course, Mascot, Status, and Intel Refinement

## What will change

- Replace the Course header’s generic industry symbol with the same real industry thumbnail used during course selection.
- Make that thumbnail tappable and show a brief “Active: [industry]” message with matching haptic feedback.
- Replace the status symbols with polished vector treatments: a layered warm flame for streak and a purple-blue potion vial for XP. No emoji or text-only icon substitutes.
- Add one shared mobile asset registry for industry thumbnails and industry-specific Leo artwork, then use it wherever these mappings are needed.
- Import the ten supplied Leo images for Aerospace, AgTech, AI, Biotech, Clean Energy, Climate Tech, Cybersecurity, Electric Vehicles, Fintech, and HealthTech.
- Use the established default Leo for Neuroscience, Space Tech, Robotics, Logistics, and Web3 because no new files were supplied for them.
- Render the active industry’s Leo in the center of every unlocked Course section. Locked sections keep the existing sleeping Leo state so lock status remains obvious.
- Keep the compact mascot container, restore the five action coins and orbit to their original larger proportions, and tighten surrounding vertical spacing so Section 1 fits cleanly without Section 2 entering the initial viewport.
- Keep the already-reduced section banner, day label, and daily title sizing.
- Preserve the existing prerequisite behavior and ensure its centered Leo remains visible above the activity headline and returns to the active lesson.
- Redesign Intel into compact scan-first story cards with takeaway tags and an inline “Read more” disclosure for longer summaries, while preserving live news, three-story rewards, quizzes, saving, discussion, and immersive reading.

## Safeguards

- No curriculum, progression, XP, streak, Notes, chat, or section-unlock logic changes.
- No replacement of contextual Leo reaction artwork used inside lessons, celebrations, or chat; only legacy industry mapping surfaces are consolidated.
- All new uploaded artwork is stored through the app’s asset system, not committed as large binaries.
- Accessibility labels remain on every icon-only control and gain expanded-state labels on Intel disclosures.

## Verification

- Package-check all changed mobile files and inspect current error logs.
- Verify all ten supplied Leo mappings plus default fallback mappings.
- Check Course at compact and standard iPhone heights for first-section fit and no Section 2 bleed.
- Exercise the industry tooltip, Leo chat tap, all five nodes, prerequisite return, Intel disclosure, article opening, save, quiz, and reward-count flow.
