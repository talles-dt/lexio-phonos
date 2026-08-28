// Temporal formant tracker.
//
// `findFormants` (in audio.ts) estimates formants per-frame in isolation, which
// makes the per-frame estimates noisy and causes F1/F2 swaps frame-to-frame.
// This module post-processes a raw formant contour with:
//   1. formant continuity tracking — assign each detected formant to the nearest
//      track (F1, F2, F3) from the previous frame, preventing index swaps;
//   2. exponential smoothing (EMA) of each track's frequency;
//   3. lightweight outlier rejection via a moving median deviation gate.
//
// The output is a smoothed FormantResult[] suitable for stable GOP scoring.

import { FormantResult } from '@/types/audio';

export interface FormantTrackerOptions {
  smoothing: number;        // EMA factor for frequency (0 = no smoothing, 1 = frozen)
  maxJumpHz: number;        // max plausible per-frame change; larger = outlier
  outlierWindow: number;    // frames considered for the median baseline
  minVoicedBandHz: number;  // frequencies below this are treated as "no formant"
}

const DEFAULT_OPTIONS: FormantTrackerOptions = {
  smoothing: 0.5,
  maxJumpHz: 400,
  outlierWindow: 5,
  minVoicedBandHz: 80,
};

interface Track {
  f1: number | null;
  f2: number | null;
  f3: number | null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Track formants across a raw per-frame contour.
 * `raw` is the output of extractFormantsFromAudio (one entry per frame, possibly
 * with f1/f2/f3 === 0 when no root was found).
 */
export function trackFormants(
  raw: FormantResult[],
  options: Partial<FormantTrackerOptions> = {}
): FormantResult[] {
  const cfg = { ...DEFAULT_OPTIONS, ...options };
  const out: FormantResult[] = [];
  const prev: Track = { f1: null, f2: null, f3: null };

  // History of recent smoothed values, used for outlier baseline.
  const histF1: number[] = [];
  const histF2: number[] = [];
  const histF3: number[] = [];

  for (let i = 0; i < raw.length; i++) {
    const frame = raw[i];

    // Candidate formants for this frame (ignore sub-banded / zero values).
    const cands: { f1: number; f2: number; f3: number } = {
      f1: frame.f1 >= cfg.minVoicedBandHz ? frame.f1 : NaN,
      f2: frame.f2 >= cfg.minVoicedBandHz ? frame.f2 : NaN,
      f3: frame.f3 >= cfg.minVoicedBandHz ? frame.f3 : NaN,
    };

    // Continuity: only accept a candidate if it is within maxJumpHz of the
    // previous smoothed value; otherwise fall back to the previous track.
    const smooth = (cand: number, prevVal: number | null): number | null => {
      if (Number.isNaN(cand)) return prevVal;
      if (prevVal !== null && Math.abs(cand - prevVal) > cfg.maxJumpHz) {
        return prevVal; // likely a swap / spurious spike
      }
      if (prevVal === null) return cand;
      return prevVal + cfg.smoothing * (cand - prevVal);
    };

    const f1 = smooth(cands.f1, prev.f1);
    const f2 = smooth(cands.f2, prev.f2);
    const f3 = smooth(cands.f3, prev.f3);

    prev.f1 = f1;
    prev.f2 = f2;
    prev.f3 = f3;

    // Outlier rejection: compare against the median of recent history.
    const reject = (val: number | null, hist: number[]): number | null => {
      if (val === null) return null;
      if (hist.length < 3) return val;
      const med = median(hist);
      if (Math.abs(val - med) > cfg.maxJumpHz) return med; // pull back to baseline
      return val;
    };

    const rF1 = reject(f1, histF1);
    const rF2 = reject(f2, histF2);
    const rF3 = reject(f3, histF3);

    if (rF1 !== null) {
      histF1.push(rF1);
      if (histF1.length > cfg.outlierWindow) histF1.shift();
    }
    if (rF2 !== null) {
      histF2.push(rF2);
      if (histF2.length > cfg.outlierWindow) histF2.shift();
    }
    if (rF3 !== null) {
      histF3.push(rF3);
      if (histF3.length > cfg.outlierWindow) histF3.shift();
    }

    const hasFormant = rF1 !== null || rF2 !== null || rF3 !== null;
    out.push({
      f1: rF1 ?? 0,
      f2: rF2 ?? 0,
      f3: rF3 ?? 0,
      confidence: hasFormant ? frame.confidence : 0,
      timestamp: frame.timestamp,
    });
  }

  return out;
}
