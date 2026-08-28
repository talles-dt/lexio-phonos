// Register service worker for PWA support
// Must be called from a client component (useEffect)

export function registerSW(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[PWA] Service worker registered:', registration.scope);
    })
    .catch((error) => {
      console.warn('[PWA] Service worker registration failed:', error);
    });
}
