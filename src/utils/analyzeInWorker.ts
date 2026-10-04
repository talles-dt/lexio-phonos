import type { AudioObservation } from "./scoring";
export function analyzeInWorker(
  samples: Float32Array,
  sampleRate: number,
): Promise<AudioObservation> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./analysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      finish();
      reject(
        new Error(
          "Acoustic analysis timed out. You can still listen to or download your recording.",
        ),
      );
    }, 15000);
    worker.onmessage = ({ data }) => {
      if (data.ready) return;
      finish();
      if (data.error) reject(new Error(data.error));
      else resolve(data.result);
    };
    worker.onerror = () => {
      finish();
      reject(
        new Error(
          "Acoustic analysis is unavailable in this browser. Your recording can still be played or downloaded.",
        ),
      );
    };
    worker.postMessage({ samples, sampleRate }, [
      samples.buffer as ArrayBuffer,
    ]);
  });
}

// Load the worker and its imports while the service worker controls this page.
export function prepareAnalysisWorker(): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./analysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error("Worker preparation timed out."));
    }, 15000);
    worker.onmessage = ({ data }) => {
      if (data.ready) {
        finish();
        resolve();
      }
    };
    worker.onerror = () => {
      finish();
      reject(new Error("Worker preparation failed."));
    };
  });
}
