import { describe, it, expect } from 'vitest';
import { calculateGOP, formantDistance, normalizeFormantDistance, analyzeDrill } from './scoring';
import { comparePitchContour, generateSyntheticPitchContour } from './pitchAnalysis';
import type { FormantResult } from '@/types/audio';
import type { PhonemeTarget } from '@/types/pronunciation';

describe('scoring utilities', () => {
  const mockFormants: FormantResult[] = [
    { f1: 300, f2: 2000, f3: 0, confidence: 0.9, timestamp: 0 },
    { f1: 280, f2: 2100, f3: 0, confidence: 0.85, timestamp: 0.05 },
  ];

  it('formantDistance returns non-negative number', () => {
    const dist = formantDistance({ f1: 300, f2: 2000 }, { f1: 400, f2: 1500 });
    expect(dist).toBeGreaterThanOrEqual(0);
  });

  it('normalizeFormantDistance returns 0-1 range', () => {
    const norm = normalizeFormantDistance(500, 2000);
    expect(norm).toBeGreaterThanOrEqual(0);
    expect(norm).toBeLessThanOrEqual(1);
  });

  it('calculateGOP returns valid score for vowel', () => {
    const gop = calculateGOP(mockFormants, 'i:');
    expect(gop.gopScore).toBeGreaterThanOrEqual(0);
    expect(gop.gopScore).toBeLessThanOrEqual(1);
    expect(gop.detectedF1).toBeGreaterThan(0);
    expect(gop.detectedF2).toBeGreaterThan(0);
  });

  it('calculateGOP returns neutral score for unknown phoneme', () => {
    const gop = calculateGOP(mockFormants, 'xyz');
    expect(gop.gopScore).toBe(0.5);
    expect(gop.isAcceptable).toBe(true);
  });
});

describe('pitch contour comparison (DTW)', () => {
  it('comparePitchContour returns 0 when coverage too low', () => {
    const detected = [
      { frequency: 0, confidence: 0, timestamp: 0 },
      { frequency: 0, confidence: 0, timestamp: 0.1 },
    ];
    const result = comparePitchContour(detected, null);
    expect(result.similarity).toBe(0);
    expect(result.coverage).toBe(0);
  });

  it('comparePitchContour gives high similarity for matching contours', () => {
    const target = generateSyntheticPitchContour([
      { phonemeId: 'i:', startTimeMs: 0, endTimeMs: 500 },
      { phonemeId: 'p', startTimeMs: 500, endTimeMs: 700 },
    ]);
    // Detected matches target exactly (same contour).
    const result = comparePitchContour(target, target);
    expect(result.similarity).toBeGreaterThan(0.9);
    expect(result.dtwDistance).toBeLessThan(1);
  });
});

describe('analyzeDrill pitch accuracy (DTW-based)', () => {
  it('produces a pitchAccuracy in 0-1 from contour comparison', () => {
    // 1 second of 16000 Hz audio at ~150 Hz (matching the synthetic target roughly)
    const sampleRate = 16000;
    const n = sampleRate;
    const samples = new Float32Array(n);
    const f0 = 150;
    for (let i = 0; i < n; i++) {
      samples[i] = 0.5 * Math.sin(2 * Math.PI * f0 * (i / sampleRate));
    }

    const phonemeSequence: PhonemeTarget[] = [
      { phonemeId: 'i:', position: 0, startTimeMs: 0, endTimeMs: 500, f1Target: 270, f2Target: 2290 },
      { phonemeId: 'p', position: 1, startTimeMs: 500, endTimeMs: 1000, f1Target: null, f2Target: null },
    ];

    const analysis = analyzeDrill('test', 'test', 't ɑː s t', phonemeSequence, samples, sampleRate);
    expect(analysis.scores.pitchAccuracy).toBeGreaterThanOrEqual(0);
    expect(analysis.scores.pitchAccuracy).toBeLessThanOrEqual(1);
    expect(analysis.scores.overall).toBeGreaterThanOrEqual(0);
    expect(analysis.scores.overall).toBeLessThanOrEqual(100);
  });
});
