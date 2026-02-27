
# Goal-Specific Curriculum Generation — IMPLEMENTED ✅

## The Problem

Currently, the `generate-curriculum` function creates ONE set of slides per day that tries to serve all 4 goals by dedicating slides 4-5 to different perspectives. This feels generic -- a founder doesn't want "their" content buried in slide 5 of a lesson designed for everyone.

## The Solution

Generate **4 separate stacks per day** -- one per learning goal -- each with ALL 6 slides written entirely from that goal's perspective. The content feels crafted, not filtered.

### What changes

```text
BEFORE:  Day 1 -> 1 stack (slides 1-3 generic, slide 4 career/investor, slide 5 founder)
AFTER:   Day 1 -> 4 stacks tagged goal:career, goal:invest, goal:build_startup, goal:curiosity
```

Each stack shares the same topic and day number but is written with a completely different voice, examples, and framing:

| Goal | Voice | Example framing for "ITAR Export Controls" |
|------|-------|-------------------------------------------|
| Career | "What you need to know for your interview at Raytheon" | Clearance timelines, compliance officer roles, resume signals |
| Invest | "How ITAR shapes defense company valuations" | Revenue concentration risk, FMS pipeline analysis, compliance cost ratios |
| Build Startup | "How to sell to DoD without ITAR killing your startup" | TAA strategies, SBIR workarounds, dual-use positioning |
| Curiosity | "The hidden geopolitics behind every fighter jet sale" | Historical cases, policy evolution, surprising consequences |

### Content volume

- 180 days x 4 goals = 720 stacks per market (up from 180)
- Each user only sees their goal's content (1 stack per day)
- Some content types can share across goals where it makes sense (e.g., TRAINER scenarios can have goal-aware feedback without needing 4 separate scenarios)

## Implementation Steps

### 1. Update the `generate-curriculum` edge function

**Changes to `generateDayContent`:**
- Accept a `goal` parameter (`career`, `invest`, `build_startup`, `curiosity`)
- Replace the current "multi-perspective" prompt with a goal-specific prompt where ALL 6 slides are written from that goal's lens
- Each goal gets a distinct system prompt persona:
  - Career: "You are a senior recruiter and hiring manager..."
  - Invest: "You are a veteran equity analyst and LP..."
  - Build Startup: "You are a serial founder and YC partner..."
  - Curiosity: "You are a brilliant science journalist..."

**Changes to the generation loop:**
- For each day, loop through all 4 goals and generate a stack for each
- Tag each stack with `goal:career`, `goal:invest`, `goal:build_startup`, or `goal:curiosity`
- TRAINER days: generate 1 shared scenario but with goal-specific feedback fields (avoids 4x redundant scenarios)

**Changes to `saveContent`:**
- Add goal tag to the `tags` array on stacks
- No schema changes needed -- the `stacks.tags` array already supports this

### 2. Update `_shared/curriculum-structures.ts`

- Add goal-specific topic angles per month so prompts can reference them
- Export a `LEARNING_GOALS` constant and `GOAL_PERSONAS` record for prompt construction

### 3. Update the Admin Content screen (web + mobile)

- Add a goal selector (or "All Goals" toggle) to the admin UI
- Show per-goal progress in the overview (e.g., "Career: 30/180, Invest: 0/180")
- The dry-run plan should report missing days per goal

### 4. Update content fetching (already partially done)

The `useHomeData` hook already queries with `goalTag`:
```typescript
.contains('tags', ['MICRO_LESSON', dayTag, goalTag])
```
And falls back to non-goal-tagged content. This means:
- New goal-tagged content will be served immediately
- Old generic content still works as fallback until replaced
- No changes needed to the home screen fetch logic

### 5. Update the Roadmap screen

- When building the roadmap, filter stacks by goal tag to show accurate completion status
- The lesson title shown should match the user's goal variant

## Technical Details

### New prompt structure (example for Career goal)

```text
System: You are a senior aerospace hiring manager and career coach with 20 years 
at Boeing, Lockheed Martin, and SpaceX. You train candidates to think, speak, 
and perform like industry insiders.

Every slide must help someone GET HIRED or ADVANCE in aerospace. Use terminology 
they'll hear in interviews. Reference real job families, skill requirements, and 
career paths. Make them sound like an insider on day one.

User: Create a LESSON about "ITAR/EAR export controls" for career seekers...
Slide 1: What ITAR is and why every aerospace employee encounters it
Slide 2: How compliance works day-to-day in your role
Slide 3: Real case -- what happened at [company] when ITAR was violated
Slide 4: Interview question: "Tell me about your experience with export controls"
Slide 5: The compliance career path (TAA specialist -> FSO -> VP Compliance)
Slide 6: Action -- get your ITAR awareness cert before your first interview
```

### Generation cost estimate

- 4 goals x 30 days = 120 API calls per month per market
- At ~1.5 min per call = ~3 hours for Month 1 of one market
- Can be parallelized within batches (current batchSize: 3-5)

### Backward compatibility

- Existing non-goal-tagged stacks continue to work via the fallback query
- New goal-tagged stacks take priority when available
- No database migration needed

## Summary of files to modify

1. `supabase/functions/generate-curriculum/index.ts` -- add goal loop, goal-specific prompts, goal tagging
2. `supabase/functions/_shared/curriculum-structures.ts` -- add goal personas and angles
3. `src/pages/AdminContent.tsx` -- add goal selector and per-goal progress display
4. `mobile/app/admin-content.tsx` -- same goal selector for mobile admin
5. `mobile/app/(tabs)/roadmap.tsx` -- filter by goal tag when building roadmap
6. `src/pages/Roadmap.tsx` -- same goal filter for web roadmap

