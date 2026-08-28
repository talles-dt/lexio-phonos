import { describe, it, expect } from 'vitest';
import { trackFormants } from './formantTracker';
import type { FormantResult } from '@/types/audio';

// Build a raw per-frame contour with one F1/F2 swap at frame 3 to simulate the
// kind of frame-to-frame instability `findFormants` produces in isolation.
function makeRawContour(): FormantResult[] {
  const base = [
    { f1: 300, f2: 2200 },
    { f1: 310, f2: 2210 },
    { f1: 305, f2: 2195 },
    { f1: 2200, f2: 320 }, // swapped (spurious)
    { f1: 308, f2: 2205 },
    { f1: 315, f2: 2212 },
  ];
  return base.map((b, i) => ({
    f1: b.f1,
    f2: b.f2,
    f3: 0,
    confidence: 1,
    timestamp: i * 0.03,
  }));
}

describe('formant tracker', () => {
  it('keeps F1/F2 continuity despite a frame swap', () => {
    const tracked = trackFormants(makeRawContour());
    // The swapped frame (index 3) should NOT propagate a 2200Hz F1.
    for (const f of tracked) {
      expect(f.f1).toBeLessThan(600);
      expect(f.f2).toBeGreaterThan(1500);
    }
  });

  it('smooths frequency estimates (no large per-frame jumps)', () => {
    const tracked = trackFormants(makeRawContour());
    for (let i = 1; i < tracked.length; i++) {
      expect(Math.abs(tracked[i].f1 - tracked[i - 1].f1)).toBeLessThan(400);
      expect(Math.abs(tracked[i].f2 - tracked[i - 1].f2)).toBeLessThan(400);
    }
  });

  it('returns empty for empty input', () => {
    expect(trackFormants([])).toEqual([]);
  });
});
