# Leo home-screen widget

## Goal
Create an iPhone home-screen widget like the reference: a bold countdown or accountability message paired with one of the five uploaded Leo expressions.

## What will change
- Add a real iOS home-screen widget, not an in-app popup.
- Use the sleepy, stern, pleading, anxious, and sly Leo PNGs as rotating visual states, cropped and centered for the widget format.
- Create a pool of short, funny, slightly antagonistic lines in Leo’s voice for streak risk, inactivity, daily lessons, comeback moments, and completed goals.
- Show useful live information where available: streak, time remaining, today’s completion state, or a concise return prompt.
- Make tapping the widget open the relevant place in MarketLingo.

## Visual direction
- Large Leo expression occupying roughly half the widget.
- High-contrast warm red/orange backgrounds for urgency, with calmer colors for completed states.
- One large number or headline, one short supporting line, and no clutter.
- Copy stays playful and sharp, never insulting or discouraging.

## Technical details
- Add an iOS WidgetKit extension compatible with the project’s Expo setup.
- Bundle the five transparent PNGs with the widget extension.
- Share the latest streak/completion snapshot with the widget through an iOS App Group, with a useful static fallback before the app has synced.
- Keep the existing in-app Leo popup system unchanged.
- Validate generated iOS configuration and mobile source before delivery.
