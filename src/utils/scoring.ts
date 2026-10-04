// Exploratory acoustic observations only. No alignment or validated pronunciation model.
import type { FormantResult, PitchResult } from "@/types/audio";
import {
  preEmphasis,
  lpc,
  findFormants,
  detectPitch,
  frameAudio,
  hammingWindow,
  applyWindow,
} from "./audio";
import { trackFormants } from "./formantTracker";
export interface AudioObservation {
  quality: "usable" | "too_short" | "silent" | "clipped" | "invalid";
  durationSeconds: number;
  rms: number;
  peak: number;
  clippedFraction: number;
  pitchContour: PitchResult[];
  formants: FormantResult[];
  message: string;
  pronunciationScore: null;
}
export function observeAudio(
  samples: Float32Array,
  sampleRate: number,
): AudioObservation {
  const base: AudioObservation = {
    quality: "invalid",
    durationSeconds: 0,
    rms: 0,
    peak: 0,
    clippedFraction: 0,
    pitchContour: [],
    formants: [],
    message: "Audio could not be read. Please record again.",
    pronunciationScore: null,
  };
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate < 8000 ||
    sampleRate > 96000 ||
    samples.length > sampleRate * 15.1
  )
    return base;
  let energy = 0,
    peak = 0,
    clipped = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) return base;
    energy += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
    if (Math.abs(sample) >= 0.99) clipped++;
  }
  base.durationSeconds = samples.length / sampleRate;
  base.rms = samples.length ? Math.sqrt(energy / samples.length) : 0;
  base.peak = peak;
  base.clippedFraction = samples.length ? clipped / samples.length : 0;
  if (base.durationSeconds < 0.4)
    return {
      ...base,
      quality: "too_short",
      message: "That recording was too short. Say the full target, then stop.",
    };
  if (base.rms < 0.003)
    return {
      ...base,
      quality: "silent",
      message:
        "Very little sound was captured. Check your microphone, move closer and try again.",
    };
  if (base.clippedFraction > 0.01)
    return {
      ...base,
      quality: "clipped",
      message:
        "The recording may be distorted. Move away from the microphone or lower its input volume, then try again.",
    };
  return {
    ...base,
    quality: "usable",
    message:
      "Sound captured. Listen back and decide what you want to practise next. This does not confirm that speech or the target words were detected.",
    pitchContour: extractPitchContour(samples, sampleRate),
    formants: extractFormantsFromAudio(samples, sampleRate).filter(
      (f) =>
        Number.isFinite(f.f1) &&
        Number.isFinite(f.f2) &&
        f.f1 > 80 &&
        f.f2 > f.f1,
    ),
  };
}

// Extract formants from audio frames
export function extractFormantsFromAudio(
  samples: Float32Array,
  sampleRate: number = 16000,
  frameSize: number = 1024,
  hopSize: number = 512,
  useTracker: boolean = true,
): FormantResult[] {
  const frames = frameAudio(samples, frameSize, hopSize);
  const window = hammingWindow(frameSize);
  const results: FormantResult[] = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const windowed = applyWindow(frame, window);
    const preEmphasized = preEmphasis(windowed);

    const lpcCoeffs = lpc(preEmphasized, 12);
    const formants = findFormants(lpcCoeffs, sampleRate);

    results.push({
      ...formants,
      timestamp: (i * hopSize) / sampleRate,
    });
  }

  // Apply temporal tracking (smoothing + continuity) to stabilize per-frame
  // estimates for an exploratory visualization, never a pronunciation verdict.
  return useTracker ? trackFormants(results) : results;
}

// Extract pitch contour from audio
export function extractPitchContour(
  samples: Float32Array,
  sampleRate: number = 16000,
  frameSize: number = 2048,
  hopSize: number = 512,
): PitchResult[] {
  const frames = frameAudio(samples, frameSize, hopSize);
  const results: PitchResult[] = [];

  for (let i = 0; i < frames.length; i++) {
    const pitch = detectPitch(frames[i], sampleRate);
    if (pitch) {
      results.push({
        ...pitch,
        timestamp: (i * hopSize) / sampleRate,
      });
    }
  }

  return results;
}
