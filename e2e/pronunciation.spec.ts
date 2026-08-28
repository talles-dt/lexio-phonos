import { test, expect } from '@playwright/test';

test.describe('Lexio Phonos pronunciation trainer', () => {
  test('homepage loads and shows drill list', async ({ page }) => {
    await page.goto('/');

    // Page title should contain the app name
    await expect(page).toHaveTitle(/Lexio Phonos/);

    // Drill cards should render (we expect at least the heading to appear)
    await expect(page.locator('text=Drills')).toBeVisible({ timeout: 10000 });

    // At least one drill card should be visible after data loads
    const drillCards = page.locator('[class*="drill"]');
    await expect(drillCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('can submit a recording analysis request', async ({ page }) => {
    await page.goto('/');

    // Navigate to first drill
    await expect(page.locator('[class*="drill"]').first()).toBeVisible({ timeout: 10000 });

    // The analyze endpoint should be reachable and return a valid response.
    // It expects `audioSamples` (Float32 array serialized as numbers) and a
    // `phonemeSequence`. We send a 16000 Hz sine at 150 Hz — enough for the
    // pitch contour / DTW comparison path to run end-to-end.
    const analysis = await page.evaluate(async () => {
      const sampleRate = 16000;
      const n = sampleRate; // 1s
      const audioSamples: number[] = [];
      const f0 = 150;
      for (let i = 0; i < n; i++) {
        audioSamples.push(0.5 * Math.sin(2 * Math.PI * f0 * (i / sampleRate)));
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drillId: 'sheep-ship',
          targetText: 'sheep',
          targetIpa: 'ʃ iː p',
          phonemeSequence: [
            { phonemeId: 'ʃ', position: 0, startTimeMs: 0, endTimeMs: 200, f1Target: null, f2Target: null },
            { phonemeId: 'i:', position: 1, startTimeMs: 200, endTimeMs: 500, f1Target: 270, f2Target: 2290 },
            { phonemeId: 'p', position: 2, startTimeMs: 500, endTimeMs: 1000, f1Target: null, f2Target: null },
          ],
          audioSamples,
          sampleRate,
        }),
      });
      return res.json();
    });

    // Should return a valid analysis structure
    expect(analysis).toHaveProperty('drillId');
    expect(analysis).toHaveProperty('scores');
    expect(analysis.scores).toHaveProperty('overall');
    expect(analysis.scores).toHaveProperty('pitchAccuracy');
    // Pitch accuracy now comes from DTW-based contour comparison, so it must
    // be a finite number in [0, 1].
    expect(analysis.scores.pitchAccuracy).toBeGreaterThanOrEqual(0);
    expect(analysis.scores.pitchAccuracy).toBeLessThanOrEqual(1);
  });
});
