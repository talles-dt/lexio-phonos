// Pronunciation scoring engine

import {
  GOPScore,
  PronunciationScore,
  ScoringConfig,
  PhonemeTarget,
  DrillAnalysis,
} from '@/types/pronunciation';
import { FormantResult, PitchResult } from '@/types/audio';
import {
  downsampleAudio,
  preEmphasis,
  lpc,
  findFormants,
  detectPitch,
  frameAudio,
  hammingWindow,
  applyWindow,
} from './audio';

// Default scoring configuration
const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  gopWeight: 0.4,
  pitchWeight: 0.2,
  timingWeight: 0.2,
  formantWeight: 0.2,
  acceptableThreshold: 0.6,
};

// Vowel formant targets (from phoneme dictionary)
const VOWEL_FORMANT_TARGETS: Record<string, { f1: number; f2: number }> = {
  // High vowels
  'i:': { f1: 270, f2: 2290 },   // /iː/
  'I': { f1: 390, f2: 1990 },    // /ɪ/
  
  // Low/mid front
  'ae': { f1: 660, f2: 1720 },   // /æ/
  'e': { f1: 530, f2: 1840 },    // /ɛ/
  
  // Central
  'uh': { f1: 600, f2: 1170 },   // /ʌ/
  '@': { f1: 500, f2: 1500 },   // /ə/
  
  // Back vowels
  'ɔ:': { f1: 500, f2: 850 },    // /ɔː/
  'o:': { f1: 450, f2: 850 },    // /oː/
  'u:': { f1: 300, f2: 870 },    // /uː/
  'ʊ': { f1: 440, f2: 1020 },   // /ʊ/
  
  // Open vowels
  'ɑ:': { f1: 750, f2: 1100 },   // /ɑː/
  'ɜ:': { f1: 490, f2: 1350 },   // /ɜː/
};

// Calculate Euclidean distance between two formant pairs
export function formantDistance(
  detected: { f1: number; f2: number },
  target: { f1: number; f2: number }
): number {
  const f1Diff = detected.f1 - target.f1;
  const f2Diff = detected.f2 - target.f2;
  return Math.sqrt(f1Diff * f1Diff + f2Diff * f2Diff);
}

// Normalize formant distance to 0-1 range
export function normalizeFormantDistance(
  distance: number,
  maxDistance: number = 2000
): number {
  return 1 - Math.min(1, distance / maxDistance);
}

// Calculate GOP (Goodness of Pronunciation) score for a phoneme
export function calculateGOP(
  detectedFormants: FormantResult[],
  targetPhonemeId: string,
  targetFormants: { f1: number; f2: number } | null = null
): GOPScore {
  const target = targetFormants || VOWEL_FORMANT_TARGETS[targetPhonemeId];
  
  if (!target) {
    return {
      phonemeId: targetPhonemeId,
      position: 0,
      startTimeMs: 0,
      endTimeMs: 0,
      gopScore: 0.5, // Neutral score for consonants or unknown phonemes
      detectedF1: null,
      detectedF2: null,
      targetF1: null,
      targetF2: null,
      isAcceptable: true,
      confidence: 0.5,
    };
  }

  // Use average of detected formants
  const avgF1 = detectedFormants.reduce((sum, f) => sum + f.f1, 0) / detectedFormants.length;
  const avgF2 = detectedFormants.reduce((sum, f) => sum + f.f2, 0) / detectedFormants.length;

  const distance = formantDistance(
    { f1: avgF1, f2: avgF2 },
    { f1: target.f1, f2: target.f2 }
  );

  const score = normalizeFormantDistance(distance);
  const confidence = detectedFormants.reduce((sum, f) => sum + f.confidence, 0) / detectedFormants.length;

  return {
    phonemeId: targetPhonemeId,
    position: 0,
    startTimeMs: 0,
    endTimeMs: 0,
    gopScore: score,
    detectedF1: avgF1,
    detectedF2: avgF2,
    targetF1: target.f1,
    targetF2: target.f2,
    isAcceptable: score >= DEFAULT_SCORING_CONFIG.acceptableThreshold,
    confidence,
  };
}

// Extract formants from audio frames
export function extractFormantsFromAudio(
  samples: Float32Array,
  sampleRate: number = 16000,
  frameSize: number = 1024,
  hopSize: number = 512
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

  return results;
}

// Extract pitch contour from audio
export function extractPitchContour(
  samples: Float32Array,
  sampleRate: number = 16000,
  frameSize: number = 2048,
  hopSize: number = 512
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

// Calculate timing score (duration comparison)
export function calculateTimingScore(
  detectedDurationMs: number,
  targetDurationMs: number,
  tolerance: number = 0.2 // 20% tolerance
): number {
  const ratio = detectedDurationMs / targetDurationMs;
  const diff = Math.abs(ratio - 1);
  return Math.max(0, 1 - diff / tolerance);
}

// Calculate overall pronunciation score
export function calculatePronunciationScore(
  gopScores: GOPScore[],
  pitchAccuracy: number,
  timingAccuracy: number,
  formantAccuracy: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): PronunciationScore {
  // Calculate average GOP score
  const avgGop = gopScores.reduce((sum, s) => sum + s.gopScore, 0) / gopScores.length;

  // Calculate overall score as weighted average
  const overall = 
    config.gopWeight * avgGop * 100 +
    config.pitchWeight * pitchAccuracy * 100 +
    config.timingWeight * timingAccuracy * 100 +
    config.formantWeight * formantAccuracy * 100;

  // Generate suggestions
  const suggestions: string[] = [];
  
  if (avgGop < config.acceptableThreshold) {
    suggestions.push('Focus on vowel quality - your formants are not matching the target');
  }
  
  if (pitchAccuracy < 0.7) {
    suggestions.push('Work on pitch accuracy - your intonation needs improvement');
  }
  
  if (timingAccuracy < 0.7) {
    suggestions.push('Practice timing - your duration is significantly different from target');
  }

  // Count unacceptable phonemes
  const unacceptableCount = gopScores.filter(s => !s.isAcceptable).length;
  if (unacceptableCount > 0) {
    suggestions.push(`${unacceptableCount} phoneme(s) need significant improvement`);
  }

  // Build phoneme breakdown with the shape expected by PronunciationScore
  const phonemeBreakdown: PronunciationScore['phonemeBreakdown'] = gopScores.map((s) => ({
    phonemeId: s.phonemeId,
    positionIndex: s.position,
    startTimeMs: s.startTimeMs,
    endTimeMs: s.endTimeMs,
    gopScore: s.gopScore,
    targetF1: s.targetF1,
    targetF2: s.targetF2,
    detectedF1: s.detectedF1,
    detectedF2: s.detectedF2,
    isAcceptable: s.isAcceptable,
    confidence: s.confidence,
  }));

  return {
    overall,
    pitchAccuracy: pitchAccuracy * 100,
    timing: timingAccuracy * 100,
    formantAccuracy: formantAccuracy * 100,
    phonemeBreakdown,
    suggestions,
  };
}

// Analyze drill performance
export function analyzeDrill(
  drillId: string,
  targetText: string,
  targetIpa: string,
  phonemeSequence: PhonemeTarget[],
  audioSamples: Float32Array,
  sampleRate: number = 16000
): DrillAnalysis {
  // Extract formants
  const formants = extractFormantsFromAudio(audioSamples, sampleRate);
  
  // Extract pitch contour
  const pitchContour = extractPitchContour(audioSamples, sampleRate);

  // Calculate GOP scores for each phoneme
  const gopScores: GOPScore[] = [];
  
  for (const phonemeTarget of phonemeSequence) {
    // Filter formants for this phoneme's time range
    const phonemeFormants = formants.filter(
      f => f.timestamp >= phonemeTarget.startTimeMs / 1000 &&
           f.timestamp <= phonemeTarget.endTimeMs / 1000
    );

    const gopScore = calculateGOP(
      phonemeFormants,
      phonemeTarget.phonemeId,
      phonemeTarget.f1Target && phonemeTarget.f2Target 
        ? { f1: phonemeTarget.f1Target, f2: phonemeTarget.f2Target }
        : null
    );

    gopScores.push({
      ...gopScore,
      position: phonemeTarget.position,
      startTimeMs: phonemeTarget.startTimeMs,
      endTimeMs: phonemeTarget.endTimeMs,
    });
  }

  // Pitch accuracy is a placeholder heuristic for the first iteration.
  // detectPitch now applies a V/UV decision (salience + ZCR + frequency bounds),
  // but there is no target pitch contour to compare against yet.
  // The contour itself is shown in the UI via PitchContour; scoring uses only the
  // fraction of frames that returned a pitch.
  const voicedFrames = pitchContour.filter((p) => p.frequency > 0).length;
  const pitchCoverage = pitchContour.length > 0 ? voicedFrames / pitchContour.length : 0;
  // Heuristic: if most detected frames are voiced, treat pitch dimension as "present".
  // This is not a real intonation assessment — it rewards having any pitch signal.
  const pitchAccuracy = pitchCoverage > 0.5 ? 0.75 : 0.45;

  // Calculate timing accuracy
  const detectedDurationMs = (audioSamples.length / sampleRate) * 1000;
  const targetDurationMs = phonemeSequence.length > 0 
    ? phonemeSequence[phonemeSequence.length - 1].endTimeMs
    : detectedDurationMs;
  const timingAccuracy = calculateTimingScore(detectedDurationMs, targetDurationMs);

  // Calculate formant accuracy
  const avgFormantScore = gopScores.reduce((sum, s) => sum + s.gopScore, 0) / gopScores.length;

  // Calculate overall score
  const score = calculatePronunciationScore(
    gopScores,
    pitchAccuracy,
    timingAccuracy,
    avgFormantScore
  );

  return {
    drillId,
    targetText,
    targetIpa,
    phonemeSequence,
    userRecording: {
      blob: null,
      url: null,
      durationMs: detectedDurationMs,
      sampleRate,
      samples: audioSamples,
    },
    scores: score,
  };
}

// Simple DTW (Dynamic Time Warping) for alignment
export function simpleDTW(
  sequenceA: number[],
  sequenceB: number[]
): { distance: number; path: [number, number][] } {
  const m = sequenceA.length;
  const n = sequenceB.length;

  // Initialize DTW matrix
  const dtw = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(Infinity));
  dtw[0][0] = 0;

  // Fill first row and column
  for (let i = 1; i <= m; i++) {
    dtw[i][0] = dtw[i - 1][0] + Math.abs(sequenceA[i - 1] - sequenceB[0]);
  }
  for (let j = 1; j <= n; j++) {
    dtw[0][j] = dtw[0][j - 1] + Math.abs(sequenceA[0] - sequenceB[j - 1]);
  }

  // Fill the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = Math.abs(sequenceA[i - 1] - sequenceB[j - 1]);
      dtw[i][j] = cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    }
  }

  // Backtrace to find path
  const path: [number, number][] = [];
  let i = m;
  let j = n;
  path.push([i - 1, j - 1]);

  while (i > 1 || j > 1) {
    if (i > 1 && j > 1 && dtw[i][j] === dtw[i - 1][j - 1] + Math.abs(sequenceA[i - 1] - sequenceB[j - 1])) {
      i--;
      j--;
    } else if (i > 1 && dtw[i][j] === dtw[i - 1][j] + Math.abs(sequenceA[i - 1] - sequenceB[j - 1])) {
      i--;
    } else if (j > 1) {
      j--;
    }
    path.push([i - 1, j - 1]);
  }

  path.reverse();

  return {
    distance: dtw[m][n],
    path,
  };
}

// Utility functions
export function getPhonemeCategory(phonemeId: string): string {
  const categories: Record<string, string> = {
    'i:': 'vowel_tense',
    'I': 'vowel_lax',
    'ae': 'vowel_low_front',
    'e': 'vowel_mid_front',
    'uh': 'vowel_mid_central',
    'th': 'fricative_dental_voiceless',
    'dh': 'fricative_dental_voiced',
    's': 'fricative_alveolar_voiceless',
    'z': 'fricative_alveolar_voiced',
    't': 'stop_alveolar_voiceless',
    'd': 'stop_alveolar_voiced',
    'p': 'stop_bilabial_voiceless',
    'b': 'stop_bilabial_voiced',
    'k': 'stop_velar_voiceless',
    'g': 'stop_velar_voiced',
    '@': 'vowel_schwa',
  };

  return categories[phonemeId] || 'unknown';
}

export function isVowel(phonemeId: string): boolean {
  const vowelCategories = ['vowel_', 'diphthong'];
  const category = getPhonemeCategory(phonemeId);
  return vowelCategories.some(cat => category.includes(cat));
}

export { DEFAULT_SCORING_CONFIG };
