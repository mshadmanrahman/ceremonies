# Ceremonies.dev Promo Video Storyboard

**Duration:** 45-60 seconds
**Format:** 1920x1080 (landscape), also 1080x1920 (vertical for socials)
**Vibe:** Warm, energetic, playful. Matches the neobrutalist design. No corporate stock footage.
**Music:** Upbeat lo-fi or indie electronic. Think: Lakey Inspired or similar royalty-free.

---

## Scene 1: The Problem (0:00 - 0:08)

**Visual:** Dark background. Text types in like a terminal, one line at a time.

```
> Your retro tool is broken.
> Anonymity? Fake. (typing dots show who's writing)
> Action items? Forgotten by Monday.
> Estimation? A separate app. Again.
```

**Motion:** Each line fades in with stagger-in animation (same as the app's CSS).
**Music:** Starts quiet, slightly tense.

---

## Scene 2: The Hero Reveal (0:08 - 0:14)

**Visual:** Screen wipe. The Ceremonies landing page fades in. Owl and Ghost mascots tilt into frame from opposite sides (matching the -6deg/+6deg tilt).

**Text overlay:** "Agile ceremonies, done right." (the actual hero text from the site)

**Motion:** Mascots bounce in with the `ease-bounce` cubic-bezier. Squiggly underline animates under "done right."
**Music:** Beat drops. Energy shifts to upbeat.

---

## Scene 3: Estimation Room (0:14 - 0:24)

**Visual:** Quick cuts showing the estimation flow:

1. **Join screen** (name input, owl mascot) - 1.5s
2. **Card deck** (the Fibonacci cards spread out) - 2s
3. **Voting** (cards flip face-down, then a participant clicks "5") - 2s
4. **Reveal moment** (all cards flip simultaneously, confetti bursts on consensus) - 2.5s
5. **Session summary** (stats: 8 tickets, 5 players, 34 points) - 2s

**Text overlay:** "Estimation poker. Modified Fibonacci. Coffee cup for trivial."
**Motion:** Card flip uses the actual `card-flip-inner` CSS animation. Confetti burst matches `canvas-confetti`.

---

## Scene 4: Retro Room - The Star (0:24 - 0:42)

This is the main feature. Longer, more detailed.

### 4a: Silent Write (0:24 - 0:28)
**Visual:** The writing phase. Three columns (Happy/Sad/Confused) with custom SVG icons. Cards appear one by one, anonymous. No avatars, no typing indicators.
**Text overlay:** "True anonymous writing. No typing dots. No avatars."

### 4b: Canvas Grouping (0:28 - 0:33)
**Visual:** The collaborative canvas. Cards scattered. Two cursors (colored, with names) drag cards toward each other. A dashed boundary auto-appears as proximity clustering kicks in. Label appears.
**Text overlay:** "Drag. Group. Everyone sees. Everyone moves."
**Motion:** Cursor movement is smooth, boundary appears with fade-in.

### 4c: Anonymous Voting + Reveal (0:33 - 0:37)
**Visual:** Vote phase. Mystery boxes (`?`) on each group. Vote dots fill up (3 per person). Progress bar goes from 0% to 100%. Then: the reveal. `?` boxes animate into numbers. Groups re-sort by vote count.
**Text overlay:** "Vote in secret. Reveal together."
**Motion:** The `consensus-enter` pop animation on the numbers.

### 4d: Discuss & Act (0:37 - 0:42)
**Visual:** The merged discuss+act view. Ranked topics with inline action items. Someone types an action item, assigns it to a teammate.
**Text overlay:** "Action items. Assigned. Tracked."

---

## Scene 5: The Haunting (0:42 - 0:48)

**Visual:** Ghost mascot floats in (ghost-float animation). Previous action items appear with "Done / Not done" buttons. One gets marked "Still haunting" with a ghost icon.

**Text overlay:** "The Haunting. Last retro's promises open the next one."
**Motion:** Ghost-float CSS animation. Items stagger in.

---

## Scene 6: Closer (0:48 - 0:55)

**Visual:** Landing page pulls back to full view. The three feature cards are visible. Dark mode.

**Text sequence (typed):**
```
Open source. Self-hostable.
Google + GitHub sign-in.
ceremonies.dev
```

**Final frame:** Owl + Ghost mascots centered. "ceremonies.dev" in display font below. Hard shadow card containing the URL.

**Music:** Fades out on the last beat.

---

## Assets Needed

| Asset | Source | Status |
|-------|--------|--------|
| Landing page screenshot (dark) | dogfood screenshots | Have |
| Landing page screenshot (light) | dogfood screenshots | Have |
| Estimation join screen | dogfood screenshots | Have |
| Retro join screen | dogfood screenshots | Have |
| Writing phase screenshot | Need to capture locally |  |
| Canvas grouping screenshot | Need to capture locally |  |
| Voting phase (mystery boxes) | Need to capture locally |  |
| Voting reveal | Need to capture locally |  |
| Discuss & Act view | Need to capture locally |  |
| The Haunting phase | Need to capture locally |  |
| Owl SVG | public/owl-mascot.svg | Have |
| Ghost SVG | public/ghost-mascot.svg | Have |
| Music track | Royalty-free (Pixabay or similar) | Need |

## Technical Notes

- Built with Remotion (React video framework)
- Each scene = a React component with `useCurrentFrame()` for timing
- CSS animations from the actual app reused directly (import globals.css)
- Screenshots imported as static images, animated with `interpolate()` for zoom/pan
- Target: 30fps, H.264 MP4
- Render command: `npx remotion render promo-video out/ceremonies-promo.mp4`
