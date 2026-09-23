# Hyperframes Composition Brief: Mera Khet

## Objective
Create a short launch-style brag video for Mera Khet.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: /home/claude/mera-khet
- Primary files read: app/layout.tsx, app/globals.css, components/farm/hero.tsx, components/farm/how-it-works.tsx, components/farm/farm-transparency.tsx, components/farm/feeding-families-impact.tsx, components/farm/pricing.tsx, components/farm/final-cta.tsx, README.md, package.json
- Product name: Mera Khet
- Tagline / strongest claim: "Your own wheat, grown for you." / "From our soil to your plate — you should know your food." / "Your plot feeds more than your family."
- Key UI or visual moment to recreate: the Farm Camera live viewer (pulsing "DEMO CAMERA" dot + camera tab switcher) and the hero's Member Dashboard preview card
- Copy that must appear verbatim:
  - Your own wheat, grown for you.
  - You don't have to take our word for it.
  - Your plot feeds more than your family.
  - From our soil to your plate.

## Creative Direction
- Tone preset: polished
- Creative direction: quiet, premium farm-to-table film — warm, honest, unhurried, rooted in real soil and real people, not corporate SaaS energy
- Interpretation: 4 scenes, longer holds (4-6s), slow crossfades (0.6-0.8s), mixed-case light-to-medium type, generous letter-spacing, restraint over hype
- Angle: Not a SaaS demo — a real farm, a real member's plot, watched all season and brought home, closing on the one claim that isn't marketing copy: part of every plot feeds a family that needs it.
- Hook: Full-bleed golden-hour farm photo with the actual headline settling in.
- Outro / punchline: "Mera Khet" wordmark + "From our soil to your plate." on deep green, held in near-silence.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: #F7F3E9 (warm off-white), deep #ECE4D0
- Text: #232920 (ink), soft #5B6357
- Accent: #C79A4B (gold), #3E5A3C / #263422 (green), #8A5A34 (brown), #C24A2C (live red)
- Display font: Fraunces (Google Font) — fallback Georgia serif
- Body font: Inter (Google Font) — fallback system-ui
- Mono/data font: JetBrains Mono (Google Font) — fallback monospace
- Visual references from the project: farmer-hand-wheat-sunset.jpg (hero), cam-main-field.jpg / cam-farm-entrance.jpg (CCTV), the site's live-pulse dot keyframe, the Member Dashboard preview card, the Farm Camera viewer chrome

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3s — full-bleed hero photo, headline "Your own wheat, / grown for you." settles in, mono label "SUJANGARH, RAJASTHAN"
2. Reveal — 5s — Member Dashboard card recreation: "3 Plots", "21,780 sq ft · ~0.5 acre", Crop/Status details settle in sequentially, Farm Camera pill
3. Highlight: Farm Camera — 6s — dark camera viewer, live-pulse "DEMO CAMERA" dot, tab switches Main Field → Farm Entrance mid-scene, caption "You don't have to take our word for it."
4. Impact + Outro — 6s — Feeding Families stat count-up (contributed amount + families fed), cross-fades into wordmark "Mera Khet" + tagline on deep green

## Audio
- Audio role: warm bed, restrained
- Audio arc: gentle bed under scenes 1-3, slight swell into scene 4, fade to near-silence under the final wordmark
- Music: happy-beats-business-moves-vol-10-by-ende-dot-app.mp3 (copied into composition/assets/music/)
- Music treatment: low volume throughout, fade out over the final ~1s
- Music cue guidance: bundled preset available (109.96 BPM). Strong cues near 20.19s/20.74s; beat grid ~0.55s apart. Use for scene-cut alignment only, not for readable text reveals.
- Audio-reactive treatment: subtle — live-pulse dot and stat counters may breathe slightly with the beat
- Audio-coupled moments:
  - Scene 2 detail cells — soft UI-arrival tick per cell
  - Scene 3 camera-tab switch — soft tap/click
  - Scene 4 stat count-up — soft tick in time with the beat; no sound on final wordmark landing
- SFX selection guidance: sparse, motion-matched, professional restraint (3-4 cues total); prefer low high-frequency-risk sounds from the ui/interface set
- SFX analysis guidance: use skills/brag/assets/sfx/sfx-analysis.md if present
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation
- Audio files: music copied into `brag-output/composition/assets/music/`; Hyperframes should copy any selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes, hyperframes-cli. Prefer native Hyperframes conventions. Show at least one real UI/copy/visual element from the source project (Farm Camera viewer + Member Dashboard card + real photography). Keep all text readable. Keep duration 15-25s. Include the planned music/SFX layer. Beat-lock at most 1-3 major moments; snap sequential reveals to the beat grid only where it doesn't hurt reading time. Run `hyperframes check` before render.
