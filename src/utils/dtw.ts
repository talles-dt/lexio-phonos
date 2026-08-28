// Simple DTW (Dynamic Time Warping) for sequence alignment.
// Kept in its own module to avoid a circular dependency between
// scoring.ts (which uses it indirectly) and pitchAnalysis.ts (which uses it directly).

export interface DTWResult {
  distance: number;
  path: [number, number][];
}

export function simpleDTW(
  sequenceA: number[],
  sequenceB: number[]
): DTWResult {
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
