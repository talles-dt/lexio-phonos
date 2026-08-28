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

    // The analyze endpoint should be reachable and return a valid response
    const analysis = await page.evaluate(async () => {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drillId: 'dummy',
          targetText: 'test',
          targetIpa: 't ɑː s t',
          phonemeSequence: [
            { phonemeId: 't', position: 0, startTimeMs: 0, endTimeMs: 10000, f1Target: null, f2Target: null },
          ],
          audioBlobUrl: null,
          durationMs: 5000,
          sampleRate: 16000,
        }),
      });
      return res.json();
    });

    // Should return a valid analysis structure
    expect(analysis).toHaveProperty('drillId');
    expect(analysis).toHaveProperty('scores');
    expect(analysis.scores).toHaveProperty('overall');
  });
});
