import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("learner screen passes automated accessibility checks on mobile and desktop", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Favorite Sheep vs Ship", exact: true }),
  ).toBeEnabled();
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath(`learner-${width}.png`),
      fullPage: true,
    });
  }
});
test("browser model lists local English voices only and exposes speed controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        text: string;
        voice: unknown = null;
        rate = 1;
        lang = "";
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    const voices = [
      {
        voiceURI: "local-en",
        name: "Local English",
        lang: "en-GB",
        localService: true,
      },
      {
        voiceURI: "remote-en",
        name: "Remote English",
        lang: "en-US",
        localService: false,
      },
      {
        voiceURI: "local-pt",
        name: "Portuguese",
        lang: "pt-BR",
        localService: true,
      },
    ];
    Object.defineProperty(speechSynthesis, "getVoices", {
      value: () => voices,
    });
    Object.defineProperty(speechSynthesis, "speak", {
      value: (u: SpeechSynthesisUtterance) =>
        Object.assign(window, {
          spoken: { text: u.text, voice: u.voice?.voiceURI, rate: u.rate },
        }),
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("combobox", { name: "Voice", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("combobox", { name: "Voice", exact: true })
      .locator("option"),
  ).toHaveCount(1);
  await page.getByRole("combobox", { name: "Speed" }).selectOption("0.7");
  await page.getByRole("button", { name: "Listen to model" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { spoken: unknown }).spoken,
    ),
  ).toEqual({ text: "Sheep", voice: "local-en", rate: 0.7 });
  await page.getByRole("button", { name: "Stop model" }).click();
  await expect(
    page.getByRole("button", { name: "Listen to model" }),
  ).toBeVisible();
});
