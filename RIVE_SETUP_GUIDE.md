# 🦊 LEO RIVE ANIMATION SETUP GUIDE

This guide explains how to create and integrate Leo's Rive animation file.

## 📦 What's Already Set Up

✅ `@rive-app/react-canvas` package installed  
✅ `LeoRive.tsx` component ready to load your `.riv` file  
✅ `LeoRiveWithFallback` component (uses existing puppet until Rive is ready)  
✅ State machine integration with proper inputs  

## 🎯 Creating the leo.riv File

### Step 1: Open Rive Editor
Go to [rive.app](https://rive.app) and create a free account.

### Step 2: Import Your Artwork
1. Export Leo's sticker as layered SVG or PSD with these separate layers:
   - Body (main torso)
   - Head
   - Left Ear
   - Right Ear  
   - Tail (ideally 2-3 segments)
   - Hat (graduation cap)
   - Tassel
   - Eyes (left & right)
   - Mouth

2. Import into Rive: File → Import → Select your layered file

### Step 3: Add Deformation Meshes

For each major part, add a mesh:

**Body Mesh** (8-12 control points)
- Place points around the torso outline
- Focus on chest, belly, and hips
- This enables breathing and squash/stretch

**Head Mesh** (6-10 points)
- Points around face perimeter
- Enables cheek squish and expressions

**Tail Mesh** (6-8 points along curve)
- Points along the length
- Enables flowing wave motion

**Ears** (3-4 points each)
- Simple mesh for perk/droop

### Step 4: Create Bones (Optional but Recommended)

Add bones for:
- Spine (3-4 bones from hip to head)
- Tail (2-3 bones)
- Each ear (1 bone)
- Hat attachment

### Step 5: Create State Machine

Name it exactly: `LeoSM`

Add these inputs:

**Boolean Inputs:**
| Name | Type | Purpose |
|------|------|---------|
| `idle` | Boolean | Default breathing state |
| `thinking` | Boolean | Head tilt, eyes up |
| `urgent` | Boolean | Shake + bounce |

**Trigger Inputs:**
| Name | Type | Purpose |
|------|------|---------|
| `success` | Trigger | Jump celebration |
| `failure` | Trigger | Sad droop |
| `celebrate` | Trigger | Big party mode |
| `wave` | Trigger | Friendly wave |

### Step 6: Animate Each State

#### 💤 Idle Animation
- Subtle torso breathing (scale Y: 1.0 → 1.02 → 1.0, 3s loop)
- Tail slow sway (rotate: -5° → 5°, 2s loop)
- Natural blink every 3-5s (use random timing)
- Ears micro-twitch occasionally

#### 🤔 Thinking Animation
- Head tilts slightly right
- Eyes look up and dart
- Tail slower, thoughtful sway

#### 🎉 Success Animation (Trigger)
1. **Anticipation** (0.1s): Body squashes down (scale Y: 0.9)
2. **Launch** (0.15s): Body stretches up (scale Y: 1.15, Y position up)
3. **Air** (0.1s): Float moment
4. **Land** (0.2s): Squash + elastic settle

#### 😕 Failure Animation (Trigger)
- Ears droop (rotate down 20°)
- Body compresses slightly
- Tail lowers
- Eyes half-close

#### 🚨 Urgent Animation
- Light body shake
- Fast tail flicks
- Alert expression

#### 🎊 Celebrate Animation (Trigger)
- Multiple hops
- Tail spins/waves rapidly
- Tassel bounces
- Confetti expression

### Step 7: Apply Easing

Use bouncy easing curves for all motion:
```
cubic-bezier(0.34, 1.56, 0.64, 1)
```

In Rive, this is achieved by:
- Dragging keyframe handles to overshoot
- Using the "Bounce" interpolation preset

### Step 8: Export

1. File → Export → Download
2. Save as `leo.riv`
3. Place in `public/animations/leo.riv`

## 🔧 Using in Code

Once your `leo.riv` file is in place:

```tsx
import { LeoRive } from "@/components/mascot/LeoRive";

// Basic usage
<LeoRive size={200} state="idle" />

// With state control
<LeoRive 
  size={200} 
  state={currentState}
  onClick={() => setCurrentState("celebrate")}
/>
```

### Switching from Fallback

In `LeoRive.tsx`, change this line:

```tsx
// Before (uses puppet fallback)
useFallback = true

// After (uses Rive)
useFallback = false
```

## 📐 Recommended Artboard Size

- Width: 512px
- Height: 512px
- Transparent background

## 🎨 Asset Preparation Tips

1. **Keep layers separate** - Don't merge anything
2. **Use vector where possible** - Scales better
3. **Name layers clearly** - e.g., "Body", "LeftEar", "TailSegment1"
4. **Export at 2x** - For crisp rendering on high-DPI screens

## 🐛 Troubleshooting

**Animation not playing?**
- Check state machine name is exactly `LeoSM`
- Verify input names match exactly (case-sensitive)

**Leo looks blurry?**
- Check artboard size (should be 512x512 minimum)
- Ensure layout fit is set to `Contain`

**Mesh deformation looks wrong?**
- Reduce number of mesh points
- Check bone influences aren't overlapping

## 📚 Resources

- [Rive Documentation](https://help.rive.app/)
- [Rive React Guide](https://rive.app/community/doc/react/docvlgbnS1mp)
- [Mesh Deformation Tutorial](https://www.youtube.com/watch?v=example)
- [State Machines Guide](https://help.rive.app/editor/state-machine)

---

Once you have the `leo.riv` file ready, Leo will have premium, organic, Duolingo-level animations with real squash & stretch! 🦊✨
