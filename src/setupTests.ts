import '@testing-library/jest-dom/vitest';

// Stub crypto.randomUUID in happy-dom / Node-like test environments.
// globalThis.crypto may be a read-only getter, so we replace it with
// Object.defineProperty instead of a direct assignment or Proxy.
Object.defineProperty(globalThis, 'crypto', {
  value: new Proxy(globalThis.crypto, {
    get(_target, prop) {
      if (prop === 'randomUUID') {
        return () => 'test-uuid-0000-0000-0000-000000000000';
      }
      return Reflect.get(globalThis.crypto, prop);
    },
  }),
  writable: true,
  configurable: true,
  enumerable: true,
});
