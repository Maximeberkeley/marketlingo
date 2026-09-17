# Fix widget, quests, lesson navigation, and Leo layout

## What will change
- Repair the iOS widget data bridge and timeline refresh so it shows the same streak and completion state as Home.
- Replace all legacy drill/game daily quests with the current Daily Arena, Deep Case, and lesson experiences.
- Award each completed quest bonus exactly once per day and refresh the visible total immediately.
- Add a small back arrow in lessons that revisits the previous card without duplicating score, XP, hearts, or rewards.
- Rebuild the Leo lesson strip so artwork keeps its original aspect ratio and short mentor text always fits its bubble.

## Validation
- Check mobile TypeScript and the generated iOS widget configuration.
- Verify quest routes, completion states, and XP refresh paths.
- Inspect the lesson header and Leo strip at narrow phone widths.
