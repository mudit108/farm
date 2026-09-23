# Hyperframes Composition Brief: Mera Khet (v2 — cinematic, narrated)

## Output
- Rendered video: brag-output-v2/brag.mp4
- Format: landscape — 1920x1080, 21s (voice-paced)
- Quality: delivery (final encode, not draft/looks)

## Source material
Same project as v1 (/home/claude/mera-khet). New element: a "50 plots already reserved this season" momentum stat (user-provided figure), inserted before the Feeding Families beat.

## Creative direction
Tone: cinematic, restrained (no hype language). Narrator-led (Kokoro am_adam voice, 6 lines, pre-generated as vo-1..vo-6.wav with exact durations driving scene timing). Music (vol-9, 114.84 BPM) ducks under every line and breathes up between them.

## Visual identity
Same palette/typography as v1 (see brag-output/composition-brief.md): #F7F3E9 / #ECE4D0 / #232920 / #3E5A3C / #263422 / #8A5A34 / #C79A4B / #C24A2C.

## Audio-reactive treatment
Full-bleed radial warmth overlay (opacity 0.04-0.12) driven by the music's bass band, pre-extracted via hyperframes-creative's extract-audio-data.py into assets/bass.json (30fps). Applied globally as a CSS custom property, never on text.

## SFX
Camera-tab switch (switch_004.ogg), stat-count tick (select_008.ogg), soft chime under final wordmark (bong_001.ogg).

## Gate
`npx hyperframes check` must pass with zero errors before render. Render at `--quality delivery`.
