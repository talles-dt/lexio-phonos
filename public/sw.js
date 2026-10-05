// Only public application assets belong in this cache. Personal API requests are never cached.
const CACHE = "lexio-phonos-v3";
const SHELL = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-180.svg",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  // An update waits until old tabs close to avoid mixing assets from two deployments.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("lexio-phonos-") && key !== CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});
async function prepareOffline(client) {
  const cache = await caches.open(CACHE);
  const response = await cache.match("/");
  if (!response) return;
  const html = await response.text();
  const urls = [
    ...new Set(
      [...html.matchAll(/(?:src|href)="([^" ]+)"/g)]
        .map((match) => match[1])
        .filter((url) => url.startsWith("/_next/static/")),
    ),
  ];
  await Promise.all(
    urls.map(async (url) => {
      if (!(await cache.match(url))) await cache.add(url);
    }),
  );
  if (urls.some((url) => /\.js(?:\?|$)/.test(url))) {
    const resources = (await cache.keys()).map((request) => request.url);
    await cache.put(
      "/__lexio_offline_ready__",
      new Response(JSON.stringify(resources)),
    );
    client?.postMessage({ type: "offline-ready" });
  }
}
self.addEventListener("message", (event) => {
  if (event.data === "claim-client") event.waitUntil(self.clients.claim());
  if (event.data === "prepare-offline")
    event.waitUntil(prepareOffline(event.source).catch(() => {}));
  if (event.data === "check-offline")
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const marker = await cache.match("/__lexio_offline_ready__");
        if (!marker) return;
        const resources = await marker.json();
        if (
          (await Promise.all(resources.map((url) => cache.match(url)))).every(
            Boolean,
          )
        )
          event.source?.postMessage({ type: "offline-ready" });
      })().catch(() => {}),
    );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return;
  const staticAsset =
    url.pathname.startsWith("/_next/static/") || SHELL.includes(url.pathname);
  if (request.mode !== "navigate" && !staticAsset) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (request.mode !== "navigate") {
        const cached = await cache.match(request);
        if (cached) return cached;
      }
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic")
          await cache.put(
            request.mode === "navigate" && url.pathname === "/" ? "/" : request,
            response.clone(),
          );
        return response;
      } catch {
        return (
          (await cache.match(request.mode === "navigate" ? "/" : request)) ||
          new Response(
            "Offline asset unavailable. Reconnect and reload to prepare offline practice.",
            { status: 503, headers: { "Content-Type": "text/plain" } },
          )
        );
      }
    })(),
  );
});
