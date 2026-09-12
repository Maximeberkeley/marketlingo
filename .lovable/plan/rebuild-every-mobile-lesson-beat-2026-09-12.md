# Rebuild every mobile lesson beat

## Goal
Make the new Lesson Kit visible from every real mobile lesson entry point and apply one consistent rule across all lesson modules: one idea per screen, generally no more than two short sentences, frequent interaction, vivid semantic color, and Leo present throughout.

## What will change

### 1. Confirm and complete lesson routing
- Trace every way a learner opens a lesson, review, quick bite, or stack in `/mobile`.
- Route all real course lessons through `LessonKitReader` and `LessonScreen`.
- Keep specialized non-course experiences separate where their workflow is intentionally different.

### 2. Add a shared short-copy system
- Create reusable text helpers that safely shorten generated and database content without cutting abbreviations, numbers, or words.
- Limit each teaching beat, prompt, option, explanation, consequence, and Leo line to the smallest useful amount of text.
- Use a general maximum of two short sentences per screen; interactive labels and answer choices remain shorter.
- Preserve factual meaning and source attribution rather than blindly truncating text.

### 3. Add reusable colorful emphasis
- Extend the lesson theme with a balanced market-game palette using semantic roles.
- Add one reusable emphasized-text renderer for figures, percentages, market terms, trends, and key phrases.
- Apply it to cold opens, micro-insights, prompts, feedback, Leo coaching, and boss decisions.
- Keep contrast accessible and avoid turning every word into a different color.

### 4. Rework every lesson module consistently
- Update Cold Open, Micro Insight, Sort Signal, Build Chain, Face-Off, Speed Round, Number Sense, Spot the Fake, Map the Market, Chart Read, The Call, Info, Multiple Choice, and Word Bank.
- Ensure compact content, stable screen height, clear interaction, immediate visual feedback, and no paragraph-heavy cards.
- Keep the existing real industry packs, sourced statistics, trainer scenarios, drills, hearts, combos, XP, sounds, and haptics.

### 5. Validate real lessons
- Check representative lessons for finance, AI/tech, logistics/retail, and one extended industry pack.
- Verify the lesson opens through the new kit, text remains readable, controls do not overlap, and every beat has meaningful industry content.
- Run the mobile TypeScript checks and inspect the latest build/runtime logs.

## Technical details
- Primary scope: `mobile/lesson-kit/**`, `mobile/components/slides/LessonKitReader.tsx`, and any mobile lesson entry point still using a legacy reader.
- No backend, monetization, news-feed, or curriculum-schema changes.
- Existing lesson data remains the source of truth; presentation helpers enforce the shorter format at the lesson boundary.
