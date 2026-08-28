import { describe, it, expect } from 'vitest';
import { calculateGOP, formantDistance, normalizeFormantDistance } from './scoring';
import type { FormantResult } from '@/types/audio';

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
