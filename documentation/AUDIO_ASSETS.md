# Audio and original vector production assets

The **active main background is the user-supplied MP3**, included directly at the user’s explicit request. Its filename identifies Grandmaster Flash & the Furious Five, “The Message,” from a Vice City Wildstyle recording. It is external supplied audio, not a composition or recording created by this project, and no original-work or new licensing claim is made for it. The original synthesized score remains as an alternate source asset. VIP music, game sound effects, vector geometry and branding were created specifically for this project.

## Audio inventory

| Production stem | Presentation use | Length | Design |
| --- | --- | ---: | --- |
| `main_theme.mp3` | Active main background; supplied recording | ~377.104 s metadata / 377.069 s browser | Exact copy of the user-provided MP3; streamed with loop enabled |
| `assets-source/audio/main_theme.wav` and `alternate_main_theme.wav` | Original synthesized alternate; not active main music | 86.400 s | Original 100 BPM, 36-bar electro-funk score: intro, verse, chorus, break, final chorus and outro; independently written sparse electro hook, bass/drum focus, dry backbeat, restrained FM electric-piano and wah-guitar-like accents, occasional synth-brass answers and short section-ending fills |
| `nightclub_theme.wav` | VIP presentation / labelled feature preview | 60.000 s | Original 112 BPM, 28-bar electro-funk club-radio arrangement: intro, two hook choruses, instrumental break and outro, sparse synth answers, a more energetic syncopated kick pattern and the same dry backbeat |
| `button_click.wav` | Button acknowledgement | 0.085 s | Short ascending oscillator click |
| `reel_spin.wav` | Spin onset | 0.800 s | Filtered procedural noise and rhythmic reel ticks |
| `reel_stop.wav` | Individual reel stop | 0.170 s | Low percussive oscillator with noise transient |
| `coin_win.wav` | Small and medium win | 0.950 s | Five ascending synthesized bell plucks |
| `celebration.wav` | Larger win celebration | 6.400 s | Original electro-funk victory sting: the independent sparse hook, syncopated bass, dry backbeat and restrained keyboard accents |
| `vip_transition.wav` | VIP skyline presentation | 1.650 s | Neon riser and tonal bloom |
| `neon_electric.wav` | Optional decorative electric accent | 0.430 s | Gated noise and electric oscillator fizz |
| `radio_preview.wav` | Optional standalone listening excerpt; not triggered by the game | 19.200 s | Eight bars from the original alternate score, crossing verse into chorus; brief edge fades and independent preview normalization |

The supplied recording is `public/assets/audio/main_theme.mp3`, **6,582,667 bytes**, SHA-256 `52e6d0606dcb3415a7a7d342c244a80f8d453db7beecd3b70f152ad5caafaf57`. Native metadata reports approximately **377.104 seconds**, stereo **44.1 kHz**, MP3, average audio bit rate approximately **139,639 bits/s**. Browser playback reports **377.068844 seconds**; this small duration difference reflects decoder/container timing. No measured reference tempo, transcription or stem analysis is claimed.

`AudioManager` streams the supplied recording through a hidden HTMLAudioElement connected to a MediaElementAudioSource, the music gain and the master mute gain. It avoids pre-decoding the full six-minute recording into a large PCM buffer. Main music loops; the VIP mode fades the recording out over 650 ms, pauses after 700 ms, and resumes the held playhead when the player returns. Browser verification confirmed `readyState` 4, advancing playback time, `loop` true and no media error, plus successful VIP pause/resume. Destruction pauses and releases the media element and disconnects its source. The offline package embeds the same supplied MP3 for local playback.

Original runtime VIP/effect files remain band-limited 22.05 kHz, mono, 16-bit PCM WAV, each with a losslessly gzip-compressed transport fallback. The manager requests gzip when browser `DecompressionStream` is available and falls back to ordinary WAV. Compression is transport compression, not a lossy audio codec. The club WAV is 2,646,044 bytes; the optional original preview is 846,764 bytes and is not preloaded or triggered by the game. Full-resolution original 44.1 kHz stereo masters live in `assets-source/audio/`.

The **original alternate** has a stereo master at `assets-source/audio/main_theme.wav`; its mono 22.05 kHz export and gzip live at `assets-source/audio/alternate_main_theme.wav` and `alternate_main_theme.wav.gz`. It is a 100 BPM, 86.4-second independently written electro-funk score with six sections. The original VIP score is 112 BPM and 60 seconds. No notes, bass pattern, lyrics or extracted samples from the supplied MP3 were used to generate these synthesized files.

`public/assets/audio/audio_measurements.json` records the original synthesis measurements: its `main_theme` entry describes the **alternate synthesized score**, not the active supplied MP3. Those masters have bounded peaks of −2.85 dBFS without clipped integer samples; the alternate RMS is −16.25 dBFS and nightclub RMS is −16.02 dBFS. These level measurements make no assertion about the supplied recording’s peak/RMS or provenance. Original PCM production uses low-pass filtering, soft console-style saturation, integer-bar loops and a 4 ms boundary de-click. The generator does not read or alter the supplied MP3.

## Runtime API

`src/audio.ts` exports `AudioManager`. The default state is muted, music gain `0.18`, effect gain `0.55`. There is no audio before a real user gesture and an explicit sound enable action.

- `unlock(): Promise<void>`: call from an entry click, spin click or keyboard event. Resumes an AudioContext if supported; it remains silent while muted.
- `toggleMute(): boolean`: returns the new mute state; enabling sound calls `unlock()` and starts the current music mode.
- `muted`: read-only current mute state.
- `setMusicVolume(value)` and `setSfxVolume(value)`: independent clamped 0–1 gains; changing a slider does not automatically unmute.
- `play('click' | 'spin' | 'stop' | 'win' | 'bigwin' | 'vip')`: event-driven one-shot effects. Old click/reel sounds are discarded if delayed by more than 450 ms.
- `setMode('main' | 'vip')`: changes presentation music with a 650 ms crossfade; this does not add a bonus game or affect game logic.
- `destroy()`: stops sources, releases the streaming media element, clears crossfade timers and cached buffers, disconnects gains and closes the context.

Gain changes are smoothed to avoid clicks. Audio loading and decoding failures remain silent and do not change any game outcome. Effects are independent of payout calculation. The electrical file is available for optional atmospheric use; the required public API intentionally exposes only game event names.

## Vector and raster inventory

| Asset | Original design | Export |
| --- | --- | --- |
| `public/assets/branding/logo.svg` | Chrome italic title, hot-pink script, striped sunset, skyline, palms and gold lines; tagline included | Editable 1100 × 500 SVG; `logo-master.png` 2200 × 1000 transparent master; `logo.png` 880 × 400 game-ready |
| `public/assets/branding/icon.svg` | Original VC monogram, striped sunset and neon border | SVG; `icon.png` 256 × 256 |
| `public/assets/symbols/car.svg` | Original coral wedge sports car, articulated chrome trim, gold wheels and cyan underglow | Editable SVG and 512 × 512 transparent PNG |
| `public/assets/symbols/cocktail.svg` | Original neon pink martini, turquoise glass, lime leaves and orange slice | Editable SVG and 512 × 512 transparent PNG |
| `public/assets/symbols/cash.svg` | Gold coin with open cash briefcase motif; lower center reserved for dynamic value | Editable SVG and 512 × 512 transparent PNG; no payout value baked into art |
| `public/assets/symbols/vip.svg` | Sunset Miami skyline in Art Deco nightclub arch, gold VIP letters and SCATTER label | Editable SVG and 512 × 512 transparent PNG |
| `src/icons.ts` | Consistent original stroke icons for controls | `icon(name)` returns an inline SVG string; button supplies its accessible name |

The cash and VIP art is mapped to the only special symbols in the documented replacement rules. The library adds no wild, free-spin or standalone multiplier symbol. Symbols have transparent backgrounds and retain clear silhouettes at reel-cell sizes. Character portraits and backgrounds are inventoried separately.

## Reproduction

Normal installation/build uses the shipped audio and art files; asset generation tools are optional.

- Run `python scripts/generate_audio.py` in a Python 3 environment with `numpy` to reproduce all original WAV masters, game-ready WAVs, gzip transport assets and measurements. The noise seed is fixed at 1987 for reproducibility. The original eight-bar hook, independent verse phrase, chord voicings, section form and procedural instrument patches are retained in the script. The hook and bass figure of the synthesized alternate were independently authored. When `public/assets/audio/main_theme.mp3` exists, regeneration writes the alternate mono WAV/gzip to `assets-source/audio/alternate_main_theme.wav(.gz)` and preserves the stereo master at `assets-source/audio/main_theme.wav`; it does not recreate unused public main WAVs, replace the supplied MP3 or make it original.
- Run `node scripts/export_vector_assets.cjs` in a Node environment with `sharp` to re-export branding and symbol PNGs. Ensure the intended system lettering fonts are present if re-rendering the editable text logo; shipped PNGs are the production reference.

No sound tool requires a connection to the original protected game service. No asset file encodes or determines a wager result.
