import { drills } from "./catalog";
import { guidedDrills, sessions, taskId } from "./sessions";
export const MIGRATION_BACKUP_KEY = "lexio-phonos-practice-v1-pre-sessions";
export const STORAGE_KEY = "lexio-phonos-practice-v1";
export const MAX_ATTEMPTS = 1000;
export type Reflection = "unreviewed" | "comfortable" | "again";
export interface Attempt {
  id: string;
  drillId: string;
  createdAt: string;
  durationSeconds: number;
  reflection: Reflection;
}
export type SessionReflection =
  | "unreviewed"
  | "comfortable"
  | "again"
  | "uncertain";
export interface SessionProgress {
  step: number;
  wordsAttemptId: string | null;
  phraseAttemptId: string | null;
  reflection: SessionReflection;
  completedAt: string | null;
}
export const emptySession = (): SessionProgress => ({
  step: 0,
  wordsAttemptId: null,
  phraseAttemptId: null,
  reflection: "unreviewed",
  completedAt: null,
});
export interface Progress {
  version: 2;
  sessions: Record<string, SessionProgress>;
  lastSessionId: string | null;
  attempts: Attempt[];
  favorites: string[];
  dailyGoal: number;
  lastDrillId: string | null;
}
export function emptyProgress(): Progress {
  return {
    version: 2,
    sessions: {},
    lastSessionId: null,
    attempts: [],
    favorites: [],
    dailyGoal: 3,
    lastDrillId: null,
  };
}
const ids = new Set([...drills, ...guidedDrills].map((d) => d.id));
const sessionIds = new Set(sessions.map((s) => s.id));
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function parseProgress(raw: string): Progress {
  if (raw.length > 1_000_000) throw new Error("This backup is too large.");
  const p: unknown = JSON.parse(raw);
  if (
    !object(p) ||
    (p.version !== 1 && p.version !== 2) ||
    !Array.isArray(p.attempts) ||
    p.attempts.length > MAX_ATTEMPTS ||
    !Array.isArray(p.favorites) ||
    p.favorites.length > ids.size ||
    !Number.isInteger(p.dailyGoal) ||
    Number(p.dailyGoal) < 1 ||
    Number(p.dailyGoal) > 20 ||
    (p.lastDrillId !== null &&
      (typeof p.lastDrillId !== "string" || !ids.has(p.lastDrillId)))
  )
    throw new Error("The practice backup format is invalid.");
  const seen = new Set<string>();
  const attempts: Attempt[] = p.attempts.map((a) => {
    if (
      !object(a) ||
      typeof a.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(a.id) ||
      seen.has(a.id) ||
      typeof a.drillId !== "string" ||
      !ids.has(a.drillId) ||
      typeof a.createdAt !== "string" ||
      !Number.isFinite(Date.parse(a.createdAt)) ||
      new Date(a.createdAt).toISOString() !== a.createdAt ||
      typeof a.durationSeconds !== "number" ||
      !Number.isFinite(a.durationSeconds) ||
      a.durationSeconds < 0.4 ||
      a.durationSeconds > 15.1 ||
      typeof a.reflection !== "string" ||
      !["unreviewed", "comfortable", "again"].includes(a.reflection)
    )
      throw new Error("A practice entry is invalid.");
    seen.add(a.id);
    return {
      id: a.id,
      drillId: a.drillId,
      createdAt: a.createdAt,
      durationSeconds: a.durationSeconds,
      reflection: a.reflection as Reflection,
    };
  });
  if (p.favorites.some((id) => typeof id !== "string" || !ids.has(id)))
    throw new Error("A favorite exercise is invalid.");
  const sessionProgress: Record<string, SessionProgress> = {};
  if (p.version === 2) {
    if (
      !object(p.sessions) ||
      Object.keys(p.sessions).length > sessions.length ||
      !(
        p.lastSessionId === null ||
        (typeof p.lastSessionId === "string" && sessionIds.has(p.lastSessionId))
      )
    )
      throw new Error("Invalid session progress.");
    for (const [id, value] of Object.entries(p.sessions)) {
      if (
        !sessionIds.has(id) ||
        !object(value) ||
        !Number.isInteger(value.step) ||
        Number(value.step) < 0 ||
        Number(value.step) > 6 ||
        typeof value.reflection !== "string" ||
        !["unreviewed", "comfortable", "again", "uncertain"].includes(
          value.reflection,
        ) ||
        ![value.wordsAttemptId, value.phraseAttemptId].every(
          (v) =>
            v === null ||
            (typeof v === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(v)),
        ) ||
        !(
          value.completedAt === null ||
          (typeof value.completedAt === "string" &&
            Number.isFinite(Date.parse(value.completedAt)) &&
            new Date(value.completedAt).toISOString() === value.completedAt)
        )
      )
        throw new Error("Invalid session entry.");
      // Deleting a journal entry also invalidates dependent completion evidence.
      const words = attempts.find(
        (a) =>
          a.id === value.wordsAttemptId && a.drillId === taskId(id, "words"),
      );
      const phrase = attempts.find(
        (a) =>
          a.id === value.phraseAttemptId && a.drillId === taskId(id, "phrase"),
      );
      const complete =
        !!words &&
        !!phrase &&
        value.reflection !== "unreviewed" &&
        value.completedAt !== null;
      sessionProgress[id] = {
        step: complete
          ? 6
          : Math.min(Number(value.step), !words ? 3 : !phrase ? 4 : 5),
        wordsAttemptId: words?.id ?? null,
        phraseAttemptId: phrase?.id ?? null,
        reflection: value.reflection as SessionReflection,
        completedAt: complete ? (value.completedAt as string) : null,
      };
    }
  }
  return {
    version: 2,
    sessions: sessionProgress,
    lastSessionId: p.version === 2 ? (p.lastSessionId as string | null) : null,
    attempts,
    favorites: [...new Set(p.favorites)] as string[],
    dailyGoal: Number(p.dailyGoal),
    lastDrillId: p.lastDrillId as string | null,
  };
}
export function readProgress(): Progress {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? emptyProgress() : parseProgress(raw);
}
export async function updateProgress(
  change: (current: Progress) => Progress,
): Promise<Progress> {
  const write = () => {
    const next = parseProgress(JSON.stringify(change(readProgress())));
    const previous = localStorage.getItem(STORAGE_KEY);
    if (
      previous &&
      JSON.parse(previous).version === 1 &&
      localStorage.getItem(MIGRATION_BACKUP_KEY) === null
    )
      localStorage.setItem(MIGRATION_BACKUP_KEY, previous);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  };
  // Serializes updates between tabs on supporting browsers. Reads happen inside the lock.
  return navigator.locks
    ? navigator.locks.request(STORAGE_KEY, write)
    : write();
}
export function addAttempt(progress: Progress, attempt: Attempt): Progress {
  if (progress.attempts.length >= MAX_ATTEMPTS)
    throw new Error(
      "History is full (1,000 recordings). Export it, then remove old entries to keep practising.",
    );
  return {
    ...progress,
    attempts: [attempt, ...progress.attempts],
    lastDrillId: drills.some((d) => d.id === attempt.drillId)
      ? attempt.drillId
      : progress.lastDrillId,
  };
}
export function mergeProgress(current: Progress, imported: Progress): Progress {
  const existing = new Set(current.attempts.map((a) => a.id));
  const attempts = [
    ...current.attempts,
    ...imported.attempts.filter((a) => !existing.has(a.id)),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (attempts.length > MAX_ATTEMPTS)
    throw new Error(
      "The merged history would exceed 1,000 recordings. No changes were saved.",
    );
  return {
    ...current,
    attempts,
    sessions: { ...imported.sessions, ...current.sessions },
    lastSessionId: current.lastSessionId ?? imported.lastSessionId,
    favorites: [...new Set([...current.favorites, ...imported.favorites])],
    lastDrillId: current.lastDrillId ?? imported.lastDrillId,
  };
}
export function localDay(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
export function reviewDrillIds(progress: Progress): Set<string> {
  const latest = new Map<string, Attempt>();
  for (const a of [...progress.attempts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  ))
    if (!latest.has(a.drillId)) latest.set(a.drillId, a);
  return new Set(
    [...latest.values()]
      .filter((a) => a.reflection === "again")
      .map((a) => a.drillId),
  );
}
