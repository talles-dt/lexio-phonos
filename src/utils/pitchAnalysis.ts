// Pitch contour comparison using DTW (Dynamic Time Warping)
// Compares a detected pitch contour against a target/reference contour
// and returns a similarity score in 0-1 range.

import { PitchResult } from '@/types/audio';
import { simpleDTW } from './scoring';

// Default config for pitch contour comparison
const DEFAULT_PITCH_CONFIG = {
  timeResolutionMs: 10,   // 10ms bins for temporal alignment
  maxDistance: 200,       // Max DTW distance for normalization (Hz)
  coverageThreshold: 0.3, // Min fraction of voiced frames required
};

export interface PitchContourComparison {
  similarity: number;       // 0-1, higher is better
  dtwDistance: number;      // Raw DTW distance (weighted Hz)
  coverage: number;         // Fraction of detected frames that are voiced
  detectedFrames: number;   // Number of voiced frames in detected contour
  targetFrames: number;     // Number of frames in target contour
  alignmentPath?: [number, number][]; // DTW alignment path
}

/** Build a time-indexed representation of a pitch contour.
 * Returns an array of { time, frequency } for voiced frames only. */
function buildTimeIndexedContour(
  contour: PitchResult[],
  resolutionMs: number
): { time: number; frequency: number }[] {
  const result: { time: number; frequency: number }[] = [];

  for (const p of contour) {
    if (p.frequency > 0 && p.confidence > 0) {
      const timeBin = Math.round(p.timestamp * 1000 / resolutionMs) * resolutionMs / 1000;
      result.push({ time: timeBin, frequency: p.frequency });
    }
  }

  return result;
}

/** Extract frequency sequence from time-indexed contour. */
function extractFrequencySequence(
  indexed: { time: number; frequency: number }[]
): number[] {
  return indexed.map(p => p.frequency);
}

/** Compare detected pitch contour against target/reference contour.
 * Uses DTW for temporal alignment and computes a similarity score. */
export function comparePitchContour(
  detected: PitchResult[],
  target?: PitchResult[] | null,
  config: Partial<typeof DEFAULT_PITCH_CONFIG> = {}
): PitchContourComparison {
  const cfg = { ...DEFAULT_PITCH_CONFIG, ...config };

  const detectedIndexed = buildTimeIndexedContour(detected, cfg.timeResolutionMs);
  const detectedFreqSeq = extractFrequencySequence(detectedIndexed);

  const totalDetectedFrames = detected.length;
  const voicedDetectedFrames = detectedIndexed.length;
  const coverage = totalDetectedFrames > 0
    ? voicedDetectedFrames / totalDetectedFrames
    : 0;

  if (!target || target.length === 0 || coverage < cfg.coverageThreshold) {
    return {
      similarity: 0,
      dtwDistance: Infinity,
      coverage,
      detectedFrames: voicedDetectedFrames,
      targetFrames: target ? target.length : 0,
    };
  }

  const targetIndexed = buildTimeIndexedContour(target, cfg.timeResolutionMs);
  const targetFreqSeq = extractFrequencySequence(targetIndexed);

  if (detectedFreqSeq.length < 2 || targetFreqSeq.length < 2) {
    return {
      similarity: coverage,
      dtwDistance: Infinity,
      coverage,
      detectedFrames: voicedDetectedFrames,
      targetFrames: targetIndexed.length,
    };
  }

  const dtwResult = simpleDTW(detectedFreqSeq, targetFreqSeq);
  const pathLength = dtwResult.path.length;
  const avgDistance = pathLength > 0 ? dtwResult.distance / pathLength : Infinity;
  const normalizedDistance = Math.min(1, avgDistance / cfg.maxDistance);
  const similarity = 1 - normalizedDistance;

  return {
    similarity: Math.max(0, Math.min(1, similarity)),
    dtwDistance: avgDistance,
    coverage,
    detectedFrames: voicedDetectedFrames,
    targetFrames: targetIndexed.length,
    alignmentPath: dtwResult.path,
  };
}

/** Generate a synthetic target pitch contour from a phoneme sequence.
 * Each phoneme gets a target frequency based on category heuristics;
 * gaps between voiced phonemes interpolate linearly. */
interface PhonemePitchTarget {
  phonemeId: string;
  startTimeMs: number;
  endTimeMs: number;
  targetFrequency: number | null;
}

const CATEGORY_PITCH_MAP: Record<string, number> = {
  'vowel_tense':          180,  // /iː/, /uː/ — higher register
  'vowel_lax':            150,  // /ɪ/, /ʊ/ — mid-high
  'vowel_low_front':      140,  // /æ/ — lower
  'vowel_mid_front':      155,  // /ɛ/, /e/
  'vowel_mid_central':    150,  // /ə/, /ʌ/
  'vowel_schwa':          140,  // reduced vowel
  'vowel_high_front':     185,  // /iː/
  'vowel_high_back':      170,  // /uː/
  'vowel_low_back':       135,  // /ɑː/, /ɔː/
  'fricative_dental_voiced':  160,
  'fricative_alveolar_voiced': 160,
  'stop_alveolar_voiced':     150,
  'stop_bilabial_voiced':     150,
  'stop_velar_voiced':        150,
};

const PHONEME_CATEGORY_MAP: Record<string, string> = {
  'i:':  'vowel_high_front',
  'I':   'vowel_lax',
  'ae':  'vowel_low_front',
  'e':   'vowel_mid_front',
  'uh':  'vowel_mid_central',
  'th':  'fricative_dental_voiceless',
  'dh':  'fricative_dental_voiced',
  's':   'fricative_alveolar_voiceless',
  'z':   'fricative_alveolar_voiced',
  't':   'stop_alveolar_voiceless',
  'd':   'stop_alveolar_voiced',
  'p':   'stop_bilabial_voiceless',
  'b':   'stop_bilabial_voiced',
  'k':   'stop_velar_voiceless',
  'g':   'stop_velar_voiced',
  '@':   'vowel_schwa',
  'u:':  'vowel_high_back',
  'ʊ':   'vowel_lax',
  'ɔ:':  'vowel_low_back',
  'o:':  'vowel_low_back',
  'ɑ:':  'vowel_low_back',
  'ɜ:':  'vowel_mid_central',
};

function phonemeCategory(phonemeId: string): string {
  return PHONEME_CATEGORY_MAP[phonemeId] || 'unknown';
}

/** Find the previous voiced phoneme target at or before timeMs. */
function findPreviousTarget(
  targets: PhonemePitchTarget[],
  timeMs: number
): PhonemePitchTarget | null {
  const before = targets.filter(t => t.startTimeMs <= timeMs && t.targetFrequency !== null);
  if (before.length === 0) return null;
  return before.reduce((prev, curr) => curr.startTimeMs > prev.startTimeMs ? curr : prev);
}

/** Find the next voiced phoneme target after timeMs. */
function findNextTarget(
  targets: PhonemePitchTarget[],
  timeMs: number
): PhonemePitchTarget | null {
  const after = targets.filter(t => t.endTimeMs > timeMs && t.targetFrequency !== null);
  if (after.length === 0) return null;
  return after.reduce((prev, curr) => curr.startTimeMs < prev.startTimeMs ? curr : prev);
}

export function generateSyntheticPitchContour(
  phonemeSequence: Array<{
    phonemeId: string;
    startTimeMs: number;
    endTimeMs: number;
  }>,
  basePitch: number = 150,
  pitchVariation: number = 50,
  sampleIntervalMs: number = 10,
): PitchResult[] {
  if (phonemeSequence.length === 0) return [];

  const phonemeTargets: PhonemePitchTarget[] = phonemeSequence.map(p => {
    const cat = phonemeCategory(p.phonemeId);
    const raw = CATEGORY_PITCH_MAP[cat];
    const targetFreq = raw !== undefined ? raw : null;
    return {
      phonemeId: p.phonemeId,
      startTimeMs: p.startTimeMs,
      endTimeMs: p.endTimeMs,
      targetFrequency: targetFreq,
    };
  });

  const results: PitchResult[] = [];
  const totalDurationMs = phonemeSequence[phonemeSequence.length - 1].endTimeMs;

  for (let t = 0; t <= totalDurationMs; t += sampleIntervalMs) {
    const current = phonemeTargets.find(p =>
      t >= p.startTimeMs && t <= p.endTimeMs && p.targetFrequency !== null
    );

    if (current) {
      // In-phoneme micro-variation for naturalness
      const phase = Math.sin(t / 50) * pitchVariation * 0.05;
      const freq = current.targetFrequency!;
      results.push({
        frequency: freq + phase,
        confidence: 0.8,
        timestamp: t / 1000,
      });
    } else {
      // Interpolate between surrounding voiced targets
      const prev = findPreviousTarget(phonemeTargets, t);
      const next = findNextTarget(phonemeTargets, t);
      if (prev && next && prev.targetFrequency !== null && next.targetFrequency !== null) {
        const span = next.startTimeMs - prev.startTimeMs;
        if (span > 0) {
          const ratio = (t - prev.startTimeMs) / span;
          const interpolated = prev.targetFrequency +
            ratio * (next.targetFrequency - prev.targetFrequency);
          results.push({
            frequency: interpolated,
            confidence: 0.5,
            timestamp: t / 1000,
          });
        }
      }
    }
  }

  return results;
}
