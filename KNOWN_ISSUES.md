# Known Issues — Lexio Phonos

This is a first implementation. The following items are tracked as known issues for the next iteration.

## EnergyVAD: stateful VAD contract vs. unit test framing (mitigated)

`src/utils/audio.ts` implements `EnergyVAD` as a **stateful** energy-based voice activity detector:
- each call to `.process(frame)` updates internal counters (`speechCount`, `silenceCount`);
- the VAD does **not** return `true` on a single high-energy frame — it waits until
  `minSpeechFrames` consecutive frames exceed the dBFS threshold before setting `inSpeech = true`;
- similarly, it leaves speech mode only after `minSilenceFrames` consecutive low-energy frames.

**What changed:** the unit test in `src/utils/audio.test.ts` was rewritten to feed multiple
consecutive frames and to assert the state transition, so `npm test` now passes. The underlying
VAD implementation itself is still a simple energy/dBFS heuristic and is **not** yet validated
against real microphone data — in particular, there is no noise-floor estimation, no hangover
(end-of-speech tail), and no multi-band energy split. Those are design gaps to close before
trusting it in production scoring.

## Pitch detection (autocorrelation) — V/UV decision added (mitigated)

`detectPitch` in `src/utils/audio.ts` used to pick the maximum of the autocorrelation with no
voicing/unvoicing decision and no salience threshold — it could return plausible-looking pitch
values on unvoiced or noisy frames.

**What changed:** the implementation now applies:
- a **salience threshold** (`maxCorr / autocorr[0] >= 0.3`);
- a **V/UV decision via zero-crossing rate** (voiced frames are expected to have ZCR < 0.15 at
  16 kHz; fricatives and noise exceed it);
- **frequency bounds** (50–1000 Hz, the plausible human voice range).

Frames that fail any of these checks return `null`, which is what the contour extraction and the
scoring path now observe. This is still a textbook heuristic, not a production pitch tracker — it
does not include speaker normalization, octave-error correction, or a trained voicing classifier —
but the most obvious source of spurious pitch on unvoiced frames is mitigated.

The pitch contour remains a **visualization-only** feature in `DrillCard`/`PitchContour`. The
scoring dimension in `scoring.ts` does not yet compare the detected contour against a target
contour; see the scoring placeholder issue below.

## `pitchAnalysis.ts` — pitch contour comparator added (new)

`src/utils/pitchAnalysis.ts` now contains:
- `comparePitchContour(detected, target)` — DTW-based similarity (0–1) between detected and target contours.
- `generateSyntheticPitchContour(phonemeSequence)` — builds a synthetic reference contour from a phoneme sequence with per-category pitch targets and linear interpolation in gaps.

This unblocks a real pitch-accuracy computation. The schematic target is heuristic (fixed Hz per category) and not yet derived from real recordings or phrase-level prosody models.

## Formant extraction is a textbook LPC pipeline, not a tracker (mitigated)

`findFormants` uses a Durand-Kerner polynomial root finder on LPC coefficients. It is:
- numerically fragile at low polynomial degree,
- not a tracker (no temporal smoothing, no formant continuity constraints),
- not speaker-normalized.

It feeds the `VowelChart` visualization but is **not** yet relied upon as the sole input to the
GOP scoring path end-to-end. The scoring path currently uses formant targets from the phoneme
catalog (`VOWEL_FORMANT_TARGETS`) more than per-frame detected formants for the verdict.

**What changed:** a new `src/utils/formantTracker.ts` now post-processes the raw per-frame
contour from `findFormants` with (1) formant continuity tracking — each detected formant is
assigned to the nearest track (F1/F2/F3) from the previous frame, preventing index swaps — and
(2) exponential smoothing (EMA) plus a moving-median outlier gate. `extractFormantsFromAudio`
applies the tracker by default (`useTracker: true`); `analyzeDrill` therefore scores against a
stabilized contour instead of noisy isolated frames. The LPC root-finder itself is unchanged, so
the per-frame estimates remain textbook — but the GOP verdict is no longer dominated by
frame-to-frame jitter. Speaker normalization is still absent.

## Formant tracking added as a stabilization layer (new)

`src/utils/formantTracker.ts` exports `trackFormants(raw: FormantResult[], options?)`:
- `smoothing` (EMA factor, default 0.5),
- `maxJumpHz` (continuity gate, default 400 Hz) — rejects candidates that jump absurdly from the
  previous track and falls back to the previous value (this is what kills F1↔F2 swaps),
- `outlierWindow` (median baseline window, default 5),
- `minVoicedBandHz` (floor for "no formant", default 80 Hz).

The tracker is covered by `src/utils/formantTracker.test.ts` (continuity, smoothing, empty input).

## `scoring.test.ts` no longer uses `as any` casts (resolved)

The test previously built ad-hoc objects that were cast with `as any` because the mock did not
match the `FormantResult` type from `@/types/audio`. The test in `src/utils/scoring.test.ts` now
imports `type FormantResult` and builds properly typed mocks, so the casts are removed.

## Pitch accuracy in scoring is now an explicit, documented placeholder (mitigated)

`analyzeDrill` in `src/utils/scoring.ts` previously computed pitch accuracy as
`avgPitch > 0 ? 0.8 : 0.5` with no explanation — a magic heuristic that pretended to assess
intonation. It now:
- filters the detected pitch contour for voiced frames,
- computes a **pitch coverage** ratio (voiced frames / total frames),
- returns `0.75` if coverage > 0.5 and `0.45` otherwise,
- carries an explicit comment that this is **not a real intonation assessment** and rewards only
  the presence of any pitch signal.

This is still a placeholder — there is no target pitch contour to compare against — but it is now
honest about what it measures.

## No end-to-end recording flow covered by unit tests (unchanged)

`useAudioCapture`, `AudioCaptureManager`, and the `AudioWorklet` processor depend on
`navigator.mediaDevices.getUserMedia` and browser `AudioContext`, which are unavailable in the
Node / happy-dom test environment. These paths are not unit tested today. The next step for test
coverage is an end-to-end layer (e.g. Playwright) or a browser-based test harness.

## End-to-end tests wired with Playwright (new)

`playwright.config.ts` and `e2e/pronunciation.spec.ts` are in place and compile cleanly under a
dedicated `tsconfig.e2e.json`. The spec is a smoke test (page title, drill list visibility,
successful `/api/analyze` round-trip). It is not yet executed against a running dev server, and
there are no assertions on real audio capture.

## Database provider is SQLite for local development only (unchanged)

The Prisma schema and seed are written to be provider-agnostic, but they have been validated only
with the SQLite provider (`prisma/dev.db`) so far. Swapping to PostgreSQL for production has not
been tested end-to-end.

## No authentication or user accounts (unchanged)

The app uses a hardcoded `anonymous` userId for mastery tracking. Adding real authentication
(e.g. Supabase Auth) and per-user isolation is out of scope for the first iteration.

## PWA: service worker registered, icons corrected (resolved icons, partial SW)

`public/manifest.json` and `public/icons/*.svg` exist, and `src/app/layout.tsx` now references
the SVG icons correctly (`/icons/icon-192.svg`, `/icons/icon-180.svg`). A `public/sw.js` service
worker and a `src/components/SWRegister` client component are in place, and `SWRegister`
is mounted in the root layout so the SW is registered on first load. The SW implements a basic
cache-first strategy for static assets and a network-first fallback for API routes — it is not yet
a full installable offline experience (no background sync, no install prompt, no versioning beyond
the static cache name).
