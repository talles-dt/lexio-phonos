import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "lexio-phonos-practice-v1";
async function openSession(page: Page, number = 1) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sessões guiadas · 20 sessões", exact: true })
    .click();
  await page
    .getByRole("button", { name: new RegExp(`^${number}\\. `) })
    .click();
}
async function toWords(page: Page) {
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Continuar para o gesto", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
}
async function record(page: Page) {
  await page.getByRole("button", { name: "Gravar agora", exact: true }).click();
  await expect(page.getByLabel("Duração da gravação")).toContainText(
    /(?:[1-9]\d*\.\d) \/ 15s/,
    { timeout: 10000 },
  );
  await page
    .getByRole("button", { name: "Parar gravação", exact: true })
    .click();
  await expect(
    page.getByText("Prática salva neste dispositivo.", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
}
for (const number of [1, 5, 10, 13, 15, 17, 18]) {
  test(`complete and resume a real recording session in family ${number}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const posts: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url());
    });
    await openSession(page, number);
    await toWords(page);
    await expect(
      page.getByRole("button", { name: "Continuar", exact: true }),
    ).toBeDisabled();
    await record(page);
    const audio = page.getByLabel("Sua gravação");
    await audio.evaluate((e: HTMLAudioElement) => e.play());
    await expect
      .poll(() => audio.evaluate((e: HTMLAudioElement) => e.currentTime))
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Aplicar em frase", exact: true }),
    ).toBeVisible();
    await record(page);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Ainda não consigo perceber a diferença",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Sessão concluída:", { exact: false }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Prática concluída", exact: true }),
    ).toBeVisible();
    const saved = await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!),
      key,
    );
    expect(saved.version).toBe(2);
    expect(saved.attempts).toHaveLength(2);
    expect(
      saved.sessions[`s${String(number).padStart(2, "0")}`].reflection,
    ).toBe("uncertain");
    await page
      .getByRole("button", { name: "Repetir sessão", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Objetivo", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    expect(posts).toEqual([]);
  });
}
test("guided flow migrates v1, survives offline and exports/imports session progress", async ({
  page,
  context,
}) => {
  const old = {
    version: 1,
    attempts: [],
    favorites: ["sheep-ship"],
    dailyGoal: 5,
    lastDrillId: "sheep-ship",
  };
  await page.goto("/");
  await page.evaluate(
    ({ k, v }) => localStorage.setItem(k, JSON.stringify(v)),
    { k: key, v: old },
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Sessões guiadas · 20 sessões", exact: true })
    .click();
  await page.getByRole("button", { name: /^3\. / }).click();
  await toWords(page);
  expect(
    await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("lexio-phonos-practice-v1-pre-sessions")!,
      ),
    ),
  ).toEqual(old);
  await expect(
    page.getByText("Pronto para revisitas offline", { exact: false }),
  ).toBeVisible({ timeout: 15000 });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Gravar palavras", exact: true }),
  ).toBeVisible();
  await record(page);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar backup de prática", exact: true })
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.evaluate((k) => localStorage.removeItem(k), key);
  await page.reload();
  await page.locator("input[type=file]").setInputFiles(path!);
  await page
    .getByRole("button", { name: "Sessões guiadas · 20 sessões", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Gravar palavras", exact: true }),
  ).toBeVisible();
  const data = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(data.sessions.s03.wordsAttemptId).toBeTruthy();
  expect(data.dailyGoal).toBe(3);
  expect(data.favorites).toContain("sheep-ship");
  await context.setOffline(false);
});
test("guided controls are accessible on mobile and all 20 sessions are available", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sessões guiadas · 20 sessões", exact: true })
    .click();
  const list = page.getByRole("region", {
    name: "Sessões guiadas",
    exact: true,
  });
  await expect(list.getByRole("button")).toHaveCount(20);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.screenshot({
    path: testInfo.outputPath("guided-library-320.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /^9\. / }).focus();
  await page.keyboard.press("Enter");
  await toWords(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.screenshot({
    path: testInfo.outputPath("guided-task-320.png"),
    fullPage: true,
  });
});
test("missing local American voice is explicit; remote and British voices cannot substitute", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(speechSynthesis, "getVoices", {
      value: () => [
        { voiceURI: "gb", name: "British", lang: "en-GB", localService: true },
        {
          voiceURI: "remote",
          name: "Remote",
          lang: "en-US",
          localService: false,
        },
      ],
    }),
  );
  await openSession(page);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByText("Nenhuma voz americana local disponível.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ouvir modelo", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Continuar para o gesto", exact: true }),
  ).toBeEnabled();
});
test("denied microphone and damaged storage remain actionable in Portuguese", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        Promise.reject(new DOMException("Denied", "NotAllowedError")),
    }),
  );
  await openSession(page);
  await toWords(page);
  await page.getByRole("button", { name: "Gravar agora", exact: true }).click();
  await expect(
    page.getByText("Acesso ao microfone negado.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuar", exact: true }),
  ).toBeDisabled();
  await page.evaluate((k) => localStorage.setItem(k, "damaged"), key);
  await page.reload();
  await page
    .getByRole("button", { name: "Sessões guiadas · 20 sessões", exact: true })
    .click();
  await expect(
    page.getByText("Não foi possível salvar ou ler o progresso.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "damaged",
  );
});

test("guided listening selects only local en-US and speaks the chosen target", async ({
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
    Object.defineProperty(speechSynthesis, "getVoices", {
      value: () => [
        {
          voiceURI: "local-us",
          name: "American local",
          lang: "en-US",
          localService: true,
        },
        {
          voiceURI: "local-gb",
          name: "British local",
          lang: "en-GB",
          localService: true,
        },
        {
          voiceURI: "remote-us",
          name: "American remote",
          lang: "en-US",
          localService: false,
        },
      ],
    });
    Object.defineProperty(speechSynthesis, "speak", {
      value: (u: SpeechSynthesisUtterance) =>
        Object.assign(window, {
          spoken: {
            text: u.text,
            voice: u.voice?.voiceURI,
            lang: u.lang,
            rate: u.rate,
          },
        }),
    });
  });
  await openSession(page, 3);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Texto do modelo", exact: true })
    .selectOption("bag");
  await expect(
    page.getByRole("combobox", { name: "Voz", exact: true }).locator("option"),
  ).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Velocidade", exact: true })
    .selectOption("0.7");
  await page.getByRole("button", { name: "Ouvir modelo", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { spoken: unknown }).spoken,
    ),
  ).toEqual({ text: "bag", voice: "local-us", lang: "en-US", rate: 0.7 });
});
test("guided silence cannot complete a task and pending permission can be cancelled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
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
  await openSession(page);
  await toWords(page);
  await page.getByRole("button", { name: "Gravar agora", exact: true }).click();
  await expect(page.getByLabel("Duração da gravação")).toContainText(
    /[1-9]\.\d \/ 15s/,
    { timeout: 8000 },
  );
  await page
    .getByRole("button", { name: "Parar gravação", exact: true })
    .click();
  await expect(
    page.getByText("Quase nenhum som foi capturado.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuar", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!).attempts,
      key,
    ),
  ).toEqual([]);
  await page.evaluate(() => {
    (
      window as unknown as { silenceContext: AudioContext }
    ).silenceContext.close();
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () => new Promise(() => {}),
    });
  });
  await page.getByRole("button", { name: "Gravar agora", exact: true }).click();
  await page
    .getByRole("button", { name: "Cancelar permissão", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Gravar agora", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Voltar às sessões", exact: true }),
  ).toBeEnabled();
});
