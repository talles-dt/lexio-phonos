import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "lexio-phonos-practice-v1";
test("real microphone pipeline saves, replays and survives reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const uploads: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") uploads.push(r.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Lexio Phonos", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  const stop = page.getByRole("button", {
    name: "Stop recording",
    exact: true,
  });
  await expect(stop).toBeEnabled();
  await expect(page.getByLabel("Recording duration")).toContainText(
    /(?:[1-9]\d*\.\d) \/ 15s/,
    { timeout: 8000 },
  );
  await stop.click();
  await expect(
    page.getByText("Practice saved on this device.", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  const audio = page.getByLabel("Your recording");
  await expect(audio).toBeVisible();
  await audio.evaluate(async (element: HTMLAudioElement) => {
    await element.play();
  });
  await expect
    .poll(() => audio.evaluate((e: HTMLAudioElement) => e.currentTime))
    .toBeGreaterThan(0);
  const waveform = await audio.evaluate(async (element: HTMLAudioElement) => {
    const data = await (await fetch(element.src)).arrayBuffer();
    const v = new DataView(data);
    let peak = 0;
    for (let i = 44; i < data.byteLength; i += 2)
      peak = Math.max(peak, Math.abs(v.getInt16(i, true)));
    return {
      rate: v.getUint32(24, true),
      samples: (data.byteLength - 44) / 2,
      peak,
    };
  });
  expect(waveform.rate).toBe(16000);
  expect(waveform.samples).toBeGreaterThan(12000);
  expect(waveform.peak).toBeGreaterThan(100);
  await page
    .getByRole("button", { name: "Practise again later", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Practise again later", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByText("Explore acoustic observations", { exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.reload();
  await expect(
    page.getByText("Practise again", { exact: false }).last(),
  ).toBeVisible();
  const stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.attempts).toHaveLength(1);
  expect(stored.attempts[0].reflection).toBe("again");
  expect(stored.attempts[0].durationSeconds).toBeGreaterThan(0.8);
  expect(uploads).toEqual([]);
  expect(errors).toEqual([]);
});
test("filters, favorites, review and backup round trip", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Favorite Sheep vs Ship", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Favorite Sheep vs Ship", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Show", exact: true })
    .selectOption("favorites");
  await expect(
    page.getByRole("button", { name: "Favorite Sheep vs Ship", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Search", { exact: true }).fill("no-such-exercise");
  await expect(
    page.getByText("No exercises match.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("STRESS_TIMING");
  await expect(
    page.getByRole("button", { name: /Level.*Stress and rhythm/ }).first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Daily recording goal" })
    .selectOption("5");
  await expect(
    page.getByRole("combobox", { name: "Daily recording goal" }),
  ).toHaveValue("5");
  await page.reload();
  await expect(page.getByLabel("Daily recording goal")).toHaveValue("5");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export practice backup" }).click();
  const file = await downloaded;
  const path = await file.path();
  expect(path).toBeTruthy();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Clear local history" }).click();
  await page.getByLabel("Import practice backup").setInputFiles(path!);
  await expect(
    page.getByText("Backup merged.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!).favorites,
      key,
    ),
  ).toEqual(["sheep-ship"]);
});
test("permission denied recovers with an actionable message", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        Promise.reject(new DOMException("Denied", "NotAllowedError")),
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Microphone permission was denied",
  );
  await expect(
    page.getByRole("button", { name: "Start recording", exact: true }),
  ).toBeEnabled();
});
test("damaged storage is preserved and practice remains available", async ({
  page,
}) => {
  await page.addInitScript((k) => localStorage.setItem(k, "damaged"), key);
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Existing data has not been overwritten",
  );
  await expect(
    page.getByRole("button", { name: "Start recording", exact: true }),
  ).toBeEnabled();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "damaged",
  );
});
test("retired data routes cannot read or mutate shared student data", async ({
  request,
}) => {
  for (const path of ["recordings", "mastery", "analyze"]) {
    for (const method of ["GET", "POST", "DELETE"]) {
      const r = await request.fetch(
        `/api/${path}?userId=anonymous&id=anything`,
        { method },
      );
      expect(r.status()).toBe(410);
      expect(r.headers()["cache-control"]).toBe("no-store");
    }
  }
  for (const path of ["drills", "phonemes"]) {
    expect(
      (
        await request.post(`/api/${path}`, {
          data: { title: "must not write" },
        })
      ).status(),
    ).toBe(405);
    expect((await request.get(`/api/${path}`)).ok()).toBe(true);
  }
});
test("mobile keyboard flow and offline revisit", async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(
    page.getByText("Ready for offline revisits", { exact: false }),
  ).toBeVisible({ timeout: 20000 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.getByLabel("Search", { exact: true }).focus();
  await page.keyboard.type("Ship");
  await page.getByRole("button", { name: /Ship vs Sheep Level/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Ship vs Sheep", exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Lexio Phonos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You are offline", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ship vs Sheep", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await context.setOffline(false);
});

test("pending permission can be cancelled and late tracks are released", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const native = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    Object.assign(window, { testTracks: [] });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        new Promise<MediaStream>((resolve) => {
          Object.assign(window, {
            grantMicrophone: async () => {
              const stream = await native({ audio: true });
              Object.assign(window, { testTracks: stream.getTracks() });
              resolve(stream);
            },
          });
        }),
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.evaluate(async () => {
    await (
      window as unknown as { grantMicrophone: () => Promise<void> }
    ).grantMicrophone();
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { testTracks: MediaStreamTrack[] }
        ).testTracks.every((t) => t.readyState === "ended"),
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Start recording", exact: true }),
  ).toBeEnabled();
});
test("recording stops at the time limit and releases the microphone", async ({
  page,
}) => {
  test.setTimeout(30000);
  await page.addInitScript(() => {
    const native = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        const stream = await native({ audio: true });
        Object.assign(window, { testTracks: stream.getTracks() });
        return stream;
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(
    page.getByText("Practice saved on this device.", { exact: true }),
  ).toBeVisible({ timeout: 22000 });
  const duration = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).attempts[0].durationSeconds,
    key,
  );
  expect(duration).toBeGreaterThan(14.5);
  expect(duration).toBeLessThanOrEqual(15.01);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { testTracks: MediaStreamTrack[] }
      ).testTracks.every((t) => t.readyState === "ended"),
    ),
  ).toBe(true);
});

test("offline first recording can load the analysis worker", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Ready for offline revisits", { exact: false }),
  ).toBeVisible({ timeout: 20000 });
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(page.getByLabel("Recording duration")).toContainText(
    /[1-9]\.\d \/ 15s/,
    { timeout: 8000 },
  );
  await page
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await expect(
    page.getByText("Practice saved on this device.", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await context.setOffline(false);
});

test("silence does not become a saved practice or a proficiency score", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        const context = new AudioContext();
        await context.resume();
        const destination = context.createMediaStreamDestination();
        const source = context.createConstantSource();
        source.offset.value = 0;
        source.connect(destination);
        source.start();
        Object.assign(window, { silenceContext: context });
        return destination.stream;
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(page.getByLabel("Recording duration")).toContainText(
    /[1-9]\.\d \/ 15s/,
    { timeout: 8000 },
  );
  await page
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await expect(
    page.getByText("Very little sound was captured.", { exact: false }),
  ).toBeVisible();
  const attempts = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) || '{"attempts":[]}').attempts,
    key,
  );
  expect(attempts).toEqual([]);
  await expect(page.getByLabel("Your recording")).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { silenceContext: AudioContext }
    ).silenceContext.close(),
  );
});
