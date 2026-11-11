# Shop scene backgrounds: ChatGPT prompts

These are optional upgrades. Every collection, perk and featured card already has a scene drawn in code. A PNG dropped at `mobile/assets/shop/scenes/<id>.png` replaces that coded backdrop on its own. Then run `node scripts/shop/gen-art-registry.mjs`, which registers it in `SHOP_SCENES`. Leo, his floor shadow, the turning sunburst, the sparkles and the floating glossy icons still sit on top. So the scene is **background only: no Leo, no characters, no text.**

## Shared rules (paste above every prompt)

> Flat vector sticker illustration in the same style as the Leo the fox mascot (see STYLE_BIBLE.md): bold, saturated, rounded, chunky shapes, clean closed outlines, flat fills with ONE darker shade shape per object and ONE small white highlight, no gradients except the sky/backdrop wash, no textures, no photoreal, no 3D render, no drop shadows, no text, no letters, no numbers, no logos, no people, no animals, no mascot. Wide landscape **1600x900**, fully opaque (no transparency). Keep the **centre 40% of the width and the lower 70% of the height calm and open**: a cartoon fox is composited standing there, so put the set pieces at the left and right edges and along the top. A soft floor or ground band across the bottom 15%. Duolingo-style energy: playful, bright, celebratory.

## Collections

| File | Prompt |
|---|---|
| `aerospace.png` | A deep night sky from navy (top) to bright blue (bottom), scattered white stars of two sizes, a ringed orange planet at the top right, a small white rocket with a red fin and a yellow flame rising at the top left with a dotted trail, a pale cratered moon-surface floor band. |
| `wallstreet.png` | A warm golden-amber backdrop, a layered city skyline silhouette in two tones of brown at the left and right edges with lit yellow windows, a bold green stock chart line zig-zagging up from left to top right ending in an arrow, a few gold coins, a polished floor band. |
| `lab.png` | A teal backdrop fading darker at the bottom, glass beakers and flasks with purple and cyan liquid on the left and right edges, rising bubbles, a ball-and-stick molecule (pink, yellow, blue atoms) at the top right, a lab bench floor band. |
| `startup.png` | A warm orange garage: horizontal roller-door slats faintly in the background, a whiteboard covered in yellow, pink, blue and green sticky notes at the top left, more sticky notes at the top right, a glowing light bulb on the right edge, a concrete floor band. |
| `royal.png` | A crimson throne room: heavy dark red velvet curtains with gold trim framing the left and right edges, a swagged curtain valance across the top, a red carpet running to the centre floor, small gold sparkles. |
| `tech.png` | A violet backdrop with glowing circuit-board traces and round nodes running in from the left and right edges, a small floating code window with angle brackets (shapes only, no characters) at the top right, a dark glossy floor band. |
| `field.png` | A lime-green countryside: a yellow sun at the top right, rolling green hills, three white wind turbines on the left and right edges, a grassy floor band. |
| `seasonal.png` | A pink winter-and-autumn mix: falling white snowflakes and orange and yellow leaves across the top and edges, a soft snowy floor band. |

## Featured card

| File | Prompt |
|---|---|
| `promo.png` | A deep navy-to-indigo night backdrop (#0A0E2C to #43208A) with many tiny white stars, two very faint large circles, generous empty space in the right half; elegant and calm, like a premium game-store banner. |

## Perks (the scene carries the perk's hero object; keep the centre-left calm for the card's labels)

| File | Prompt |
|---|---|
| `perk-cv-review.png` | Indigo backdrop with soft radiating rays; centred, a big glossy white CV sheet tilted slightly, with a purple header band, grey text-line bars (no letters), a green check mark, and a gold rosette seal with red ribbon tails at its lower right; small gold four-point stars around. |
| `perk-founder-call.png` | Dark navy-to-violet backdrop with rays; centred, a white video-call window with three coloured window dots, a simple faceless person bust on an indigo screen, a red record dot; a purple speech bubble with three dots at the top right and a white speech bubble at the lower left. |
| `perk-case-badge.png` | Plum-to-magenta backdrop with rays; a three-step purple podium at the bottom centre with a big gold rosette badge (scalloped edge, cream centre, a star) on top and blue ribbon tails; colourful confetti rectangles around. |
| `perk-hackathon.png` | Deep teal backdrop with rays; centred, an open laptop with a dark screen full of colourful code-line bars (no characters), a pizza slice with pepperoni at the lower right, a yellow lightning bolt at the upper left. |
| `perk-tool-credits.png` | Dark brown-to-amber backdrop with rays; centred, a fanned stack of three glossy cards (pink, blue, purple) each with a gold chip and a white stripe, small gold stars around. |

## After generating
1. Resize to 1600x900, export as PNG and save it to `mobile/assets/shop/scenes/<id>.png`. Keep the file small: around 300 KB, or run it through pngquant.
2. Run `node scripts/shop/gen-art-registry.mjs`.
3. Check the card in the app. If the scene is busy behind Leo, push its set pieces further out to the edges.
