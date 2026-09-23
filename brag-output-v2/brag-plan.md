# Brag Plan: Mera Khet (v2 — cinematic, narrated)

## What is this app?
Mera Khet is a farm-membership platform in Sujangarh, Rajasthan — reserve 1, 3, or 6 wheat plots for a season, the founder's team farms it for you, and the harvest comes home to you.

## The angle
Same real farm, same real UI as v1, but shot as a quiet cinematic short with a narrator's voice carrying the story, cross-fades instead of pop-ins, bigger holds, and one new beat: real social proof (50 plots already reserved this season) to create momentum/urgency before the emotional close.

## Hook (first 2-3 seconds)
Full-bleed golden-hour hero photo. Narrator: "There's a wheat field in Sujangarh, Rajasthan." Headline settles under it.

## Key moments (the middle)
- Member Dashboard card (real UI) — "it's yours for the season, tracked from the day it's sown"
- Farm Camera live viewer with tab switch (real UI) — "watch it grow, camera by camera, until harvest"
- NEW: "50 plots already reserved this season" — a big number count-up on a dramatic deep-green field backdrop, the social-proof/momentum beat
- Feeding Families stat count-up — "every one of them feeds a family beyond your own"

## Outro / punchline
Narrator: "Mera Khet. From our soil to your plate." Wordmark holds in near-silence after the line lands.

## User flow worth showing
Same as v1: reserve → watch the season (dashboard + camera) → harvest comes home, now with the reservation-momentum beat inserted before the emotional Feeding Families close.

## Tone
- Preset: cinematic
- Creative direction: dramatic, trailer-scale but restrained — no exclamation points, no hype language; the drama comes from the real place and real stakes, not from volume
- Interpretation: 6 scenes (adapted from the 4-5 default — narration and the new stat beat both need their own room), 3-5s each, slow dramatic reveals, narrator-led pacing (durations set by the generated voice lines, not hardcoded)

## Format: landscape — 1920x1080
## Duration: 21s (voice-paced; see per-scene VO durations below)

## Visual identity (from the project)
Same palette/fonts as v1 — see composition-brief.md for exact values.

## Share copy (draft)
Fifty plots are already reserved this season. Yours can be too — real wheat, grown for you in Rajasthan, tracked all season, and it comes home to your table. 🌾

## Voiceover script
1. "There's a wheat field in Sujangarh, Rajasthan." (2.82s, am_adam)
2. "It's yours for the season, tracked from the day it's sown." (2.84s)
3. "Watch it grow, camera by camera, until harvest." (2.71s)
4. "Fifty plots are already spoken for." (2.03s)
5. "And every one of them feeds a family beyond your own." (2.69s)
6. "Mera Khet. From our soil to your plate." (2.09s)

## Audio direction
- Role: narrator-led; music is a restrained bed that ducks under every line
- Music: happy-beats-business-moves-vol-9-by-ende-dot-app.mp3 (114.84 BPM), low throughout, ducked to ~0.13 under narration, ~0.32 in the gaps, slight swell at the outro (16.0-16.5s), fade to 0 over the final second
- Audio-reactive treatment: subtle — a full-bleed warmth overlay (soft radial gradient, opacity 0.04-0.12) breathes with the music's bass band across the whole video, extracted per-frame via extract-audio-data.py (bass.json). Non-text, background only — never on readable copy.
- SFX: camera-tab switch (soft), stat count-up tick, one soft chime under the final wordmark landing

## Storyboard

### Scene 1 — Hook — 3.3s (global 0-3.3)
Full-bleed hero photo (farmer-hand-wheat-sunset.jpg), slow Ken Burns zoom. VO1 starts 0.3s. Headline "Your own wheat, grown for you." settles in under the narration.
Transition mood: dramatic crossfade (0.6s) → Scene 2

### Scene 2 — Reveal (Member Dashboard) — 3.2s (global 3.3-6.5)
Member Dashboard card, same recreation as v1, larger/simpler reveal (single settle, no per-cell arrivals — cinematic restraint). VO2 starts at 3.5s.
Transition mood: dramatic crossfade → Scene 3

### Scene 3 — Farm Camera — 3.6s (global 6.5-10.1)
Dark camera viewer, live-pulse dot, tab switches Main Field → Farm Entrance at 9.0s (near the end of VO3, on the beat). VO3 starts 6.7s.
Transition mood: dramatic crossfade → Scene 4

### Scene 4 — NEW: Momentum — 2.6s (global 10.1-12.7)
Deep green full-bleed backdrop (wheat-field-golden.jpg, darkened). Big number counts up 0→50. Label "PLOTS ALREADY RESERVED THIS SEASON." VO4 starts 10.3s, landing on "fifty" as the number settles.
Transition mood: dramatic crossfade → Scene 5

### Scene 5 — Impact — 3.3s (global 12.7-16.0)
Feeding Families stat count-up (heart icon, headline, ₹ contributed + families fed), same content as v1. VO5 starts 12.9s.
Transition mood: dramatic crossfade → Scene 6

### Scene 6 — Outro — 5.0s (global 16.0-21.0)
Cross-fade to wordmark "Mera Khet" + tagline "From our soil to your plate." on deep green. VO6 starts 16.2s, ends ~18.29s. Music swells slightly into 16.5s then fades to silence by 21.0s. Hold the wordmark in near-silence for the last ~2.7s.

**Music mood for this video:** restrained cinematic bed, always secondary to the narrator
**Audio summary:** Six narrated lines carry the story; music ducks under each and breathes back up between them; one subtle audio-reactive warmth overlay ties the whole visual track to the music's bass; ends in near-silence on the wordmark.
