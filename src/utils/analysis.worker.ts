import { observeAudio } from "./scoring";
self.onmessage = (
  event: MessageEvent<{ samples: Float32Array; sampleRate: number }>,
) => {
  try {
    self.postMessage({
      result: observeAudio(event.data.samples, event.data.sampleRate),
    });
  } catch {
    self.postMessage({
      error:
        "Acoustic observations could not be calculated. Your recording can still be played or downloaded.",
    });
  }
};

self.postMessage({ ready: true });
