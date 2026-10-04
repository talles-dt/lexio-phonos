import { prepareAnalysisWorker } from "./analyzeInWorker";
export function registerSW(): void {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator))
    return;
  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready)
    .then(async (registration) => {
      if (!navigator.serviceWorker.controller)
        await new Promise<void>((resolve) =>
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => resolve(),
            { once: true },
          ),
        );
      await prepareAnalysisWorker();
      registration.active?.postMessage("prepare-offline");
    })
    .catch(() => {
      /* Online practice still works. UI keeps offline status pending. */
    });
}
