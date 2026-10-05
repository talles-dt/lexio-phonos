import { afterEach, expect, it, vi } from "vitest";
import { registerSW } from "./registerSW";
import { prepareAnalysisWorker } from "./analyzeInWorker";
vi.mock("./analyzeInWorker", () => ({ prepareAnalysisWorker: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("recovers an activated worker with an uncontrolled page before preparing offline audio", async () => {
  vi.stubEnv("NODE_ENV", "production");
  let control: (() => void) | undefined;
  const events: string[] = [];
  const active = {
    postMessage: vi.fn((message: string) => {
      events.push(message);
      if (message === "claim-client") {
        expect(prepareAnalysisWorker).not.toHaveBeenCalled();
        control?.();
      }
    }),
  };
  vi.mocked(prepareAnalysisWorker).mockImplementation(async () => {
    events.push("audio-prepared");
  });
  vi.stubGlobal("navigator", {
    serviceWorker: {
      controller: null,
      register: vi.fn().mockResolvedValue({ active }),
      ready: Promise.resolve({ active }),
      addEventListener: (_type: string, callback: () => void) => {
        control = callback;
      },
    },
  });
  registerSW();
  await vi.waitFor(() =>
    expect(events).toEqual([
      "claim-client",
      "audio-prepared",
      "prepare-offline",
    ]),
  );
});
