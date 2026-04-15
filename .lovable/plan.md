

# Seminars Feature — Full Build (Mobile Only, Testing Mode)

## Overview

Build the complete Seminars system: database tables, mobile screens, real-time chat, prep modules, video player, and event lifecycle. The feature is Pro-gated and functional but hidden behind a flag so it won't appear for App Store reviewers. Only accessible via direct navigation or a dev toggle.

## Database Migration

4 new tables with RLS:

**`seminars`** — Event catalog
- `id` uuid PK, `market_id` text, `title` text, `description` text
- `speaker_name` text, `speaker_title` text, `speaker_avatar_url` text
- `video_url` text (YouTube/Vimeo embed)
- `scheduled_at` timestamptz, `duration_minutes` int default 60
- `status` text default 'upcoming' (upcoming/live/completed)
- `prep_start_at` timestamptz, `post_content_at` timestamptz
- `key_takeaways` jsonb, `mini_case` text
- `tags` text[], `is_pro_only` boolean default true
- `created_at` timestamptz default now()

**`seminar_prep_modules`** — Prep content per seminar
- `id` uuid PK, `seminar_id` uuid FK→seminars ON DELETE CASCADE
- `title` text, `content` text (markdown)
- `quiz_question` text, `quiz_options` jsonb, `correct_index` int
- `sort_order` int default 0, `xp_reward` int default 25
- `created_at` timestamptz default now()

**`seminar_registrations`** — RSVP + progress tracking
- `id` uuid PK, `user_id` uuid NOT NULL, `seminar_id` uuid FK→seminars ON DELETE CASCADE
- `registered_at` timestamptz default now(), `attended` boolean default false
- `prep_completed` boolean default false, `prep_modules_done` int default 0
- UNIQUE(user_id, seminar_id)

**`seminar_chat_messages`** — Real-time discussion
- `id` uuid PK, `seminar_id` uuid FK→seminars ON DELETE CASCADE
- `user_id` uuid NOT NULL, `message` text NOT NULL
- `is_pinned` boolean default false, `created_at` timestamptz default now()
- Enable Supabase Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.seminar_chat_messages;`

**RLS Policies:**
- seminars: SELECT for authenticated
- seminar_prep_modules: SELECT for authenticated
- seminar_registrations: SELECT/INSERT/UPDATE where `user_id = auth.uid()`
- seminar_chat_messages: SELECT for authenticated, INSERT where `user_id = auth.uid()`

## Mobile Files

### New Files

| File | Purpose |
|------|---------|
| `mobile/hooks/useSeminars.ts` | Fetch seminars, register, track prep, send chat messages, Realtime subscription |
| `mobile/app/seminars.tsx` | Hub screen — upcoming, live, past seminars list |
| `mobile/app/seminar-detail.tsx` | Detail screen with 3 tabs: Prep, Watch, Takeaways |
| `mobile/components/seminars/SeminarCard.tsx` | Card with countdown timer, speaker info, status badge |
| `mobile/components/seminars/PrepModule.tsx` | Interactive prep lesson with embedded quiz |
| `mobile/components/seminars/SeminarChat.tsx` | Real-time chat panel using Supabase Realtime |
| `mobile/components/seminars/VideoPlayer.tsx` | WebView-based YouTube/Vimeo embed |

### Edited Files

| File | Change |
|------|--------|
| `mobile/app/(tabs)/practice.tsx` | Add "Seminars" card to RESOURCE_CARDS (before Leaderboard), route to `/seminars` |
| `mobile/app/_layout.tsx` | Register `seminars` and `seminar-detail` Stack screens |

## Feature Details

### Hub Screen (`seminars.tsx`)
- Sections: "Live Now" (if any), "Upcoming", "Past Seminars"
- Each card shows: speaker avatar, title, countdown/date, prep progress bar
- Pro-gated via `useSubscription`

### Detail Screen (`seminar-detail.tsx`)
- Route param: `seminarId`
- 3 tabs via horizontal pill selector:
  - **Prep** — List of prep modules with checkmarks, each expandable with quiz
  - **Watch** — Video player + live chat side-by-side (chat below on mobile)
  - **Takeaways** — Key takeaways list + mini-case, unlocked at `post_content_at`
- "Register" button triggers `seminar_registrations` insert
- XP rewards on prep completion and attendance

### Chat (`SeminarChat.tsx`)
- Supabase Realtime `postgres_changes` on `seminar_chat_messages`
- Messages show username (fetched from profiles), timestamp
- 3-second client-side rate limit
- Input pinned to bottom with KeyboardAvoidingView

### Video (`VideoPlayer.tsx`)
- React Native WebView rendering YouTube/Vimeo iframe
- Locked until `scheduled_at` has passed

### Practice Tab Card
- Positioned as first item in RESOURCE_CARDS
- Purple gradient, `video` icon, tag "PRO"
- Routes to `/seminars`

## Visibility Control

The card in Practice tab is only shown when a feature flag `SEMINARS_ENABLED` constant is `true` in the code. Set to `true` for dev/testing, flip to `false` before App Store submission. This is a simple code-level toggle, not a database flag.

## Seed Data

Insert one test seminar via the migration so there's content to test against immediately.

