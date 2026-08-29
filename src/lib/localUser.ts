// Local-only anonymous user identity.
//
// This project deliberately has NO authentication. Instead, progress for a
// given browser is tracked under a stable anonymous ID persisted in a cookie.
// The ID is generated once and reused on subsequent visits; it never leaves
// the client except as the `userId` field sent to the scoring/recording APIs
// (where it maps to the `User` table row and the UserPhonemeMastery aggregate).
//
// Why a cookie and not localStorage: the API routes receive the ID via a fetch
// query param / body built on the client, so either storage works; a cookie is
// chosen so the value is also readable by the server if needed in the future
// (e.g. middleware) without a refactor.

import { useCallback } from 'react';

const COOKIE_NAME = 'lexio_anon_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function generateId(): string {
  // Prefer crypto.randomUUID when available; fall back to a random string.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `anon_${crypto.randomUUID()}`;
  }
  return `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

/** Returns the persistent anonymous user ID, creating it on first call. */
export function getLocalUserId(): string {
  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing;
  const id = generateId();
  writeCookie(COOKIE_NAME, id, COOKIE_MAX_AGE);
  return id;
}

/** React hook wrapper for components that need the ID in render/effects. */
export function useLocalUserId(): () => string {
  return useCallback(() => getLocalUserId(), []);
}
