import { describe, expect, it, vi, afterEach } from "vitest";
import {
  emptyProgress,
  emptySession,
  parseProgress,
  mergeProgress,
  updateProgress,
  STORAGE_KEY,
  MIGRATION_BACKUP_KEY,
} from "./progress";
import {
  changeSession,
  saveSessionAttempt,
  finishSession,
} from "./sessionProgress";
import { sessions, guidedDrills, families, sessionSources } from "./sessions";
const now = "2026-10-04T12:00:00.000Z";
function recorded() {
  let p = saveSessionAttempt(
    emptyProgress(),
    "s01",
    "words",
    "words-1",
    2,
    now,
  );
  p = saveSessionAttempt(p, "s01", "phrase", "phrase-1", 2, now);
  return p;
}
afterEach(() => vi.unstubAllGlobals());
describe("guided curriculum", () => {
  it("has exactly 20 sourced sessions, seven families and two unique tasks each", () => {
    expect(sessions).toHaveLength(20);
    expect(families).toHaveLength(7);
    expect(guidedDrills).toHaveLength(40);
    expect(new Set(guidedDrills.map((d) => d.id)).size).toBe(40);
    sessions.forEach((s, index) => {
      expect(s.order).toBe(index + 1);
      expect(s.accent).toBe("en-US");
      expect(s.words).toHaveLength(4);
      for (const w of [...s.words, s.phrase]) {
        expect(w.text.length).toBeGreaterThan(0);
        expect(w.ipa.length).toBeGreaterThan(0);
        expect(w.meaning.length).toBeGreaterThan(0);
      }
      expect(s.sources.length).toBeGreaterThan(0);
      s.sources.forEach((id) =>
        expect(sessionSources[id]).toMatch(/^https:\/\//),
      );
    });
  });
  it("preserves American vowel and suffix distinctions in the teaching examples", () => {
    expect(sessions[14].words.map((w) => w.ipa)).toEqual([
      "kæts",
      "dɔɡz",
      "ˈbʌsɪz",
      "ˈwɑtʃɪz",
    ]);
    expect(sessions[15].words.map((w) => w.ipa)).toEqual([
      "wɝkt",
      "pleɪd",
      "ˈwɑntɪd",
      "ˈnidɪd",
    ]);
    expect(sessions[17].words.map((w) => w.ipa)).toEqual([
      "ʃip",
      "ʃɪp",
      "liv",
      "lɪv",
    ]);
    expect(sessions[18].note).toContain("nasais");
  });
});
describe("guided progress", () => {
  it("migrates v1 without losing notes or inventing session completion", () => {
    const old = {
      version: 1,
      attempts: [
        {
          id: "old-1",
          drillId: "sheep-ship",
          createdAt: now,
          durationSeconds: 1,
          reflection: "again",
        },
      ],
      favorites: ["sheep-ship"],
      dailyGoal: 5,
      lastDrillId: "sheep-ship",
    };
    const next = parseProgress(JSON.stringify(old));
    expect(next.version).toBe(2);
    expect(next.attempts).toEqual(old.attempts);
    expect(next.favorites).toEqual(old.favorites);
    expect(next.sessions).toEqual({});
  });
  it("requires two matching attempts and a reflection; no proficiency score", () => {
    expect(() =>
      finishSession(emptyProgress(), "s01", "comfortable", now),
    ).toThrow();
    const p = finishSession(recorded(), "s01", "uncertain", now);
    expect(parseProgress(JSON.stringify(p)).sessions.s01).toEqual({
      step: 6,
      wordsAttemptId: "words-1",
      phraseAttemptId: "phrase-1",
      reflection: "uncertain",
      completedAt: now,
    });
    expect(p.lastDrillId).toBeNull();
    expect(p.sessions.s01).not.toHaveProperty("score");
  });
  it("invalidates completion if its recording is deleted or belongs to another session", () => {
    const p = finishSession(recorded(), "s01", "again", now);
    p.attempts = p.attempts.filter((a) => a.id !== "words-1");
    const next = parseProgress(JSON.stringify(p));
    expect(next.sessions.s01.completedAt).toBeNull();
    expect(next.sessions.s01.step).toBe(3);
    expect(() => finishSession(next, "s01", "comfortable", now)).toThrow();
    const wrong = changeSession(recorded(), "s02", () => ({
      ...emptySession(),
      wordsAttemptId: "words-1",
      phraseAttemptId: "phrase-1",
    }));
    expect(() => finishSession(wrong, "s02", "again", now)).toThrow();
  });
  it("round-trips sessions and merges imports without replacing local reflections", () => {
    const current = finishSession(recorded(), "s01", "again", now);
    const imported = finishSession(recorded(), "s01", "comfortable", now);
    const merged = parseProgress(
      JSON.stringify(mergeProgress(current, imported)),
    );
    expect(merged.attempts).toHaveLength(2);
    expect(merged.sessions.s01.reflection).toBe("again");
    expect(
      parseProgress(JSON.stringify(mergeProgress(emptyProgress(), current))),
    ).toEqual(current);
  });
  it("rejects malformed or unknown session state", () => {
    for (const entry of [
      { ...emptySession(), step: NaN },
      { ...emptySession(), step: 99 },
      { ...emptySession(), reflection: "mastered" },
      { ...emptySession(), completedAt: "yesterday" },
    ]) {
      expect(() =>
        parseProgress(
          JSON.stringify({ ...emptyProgress(), sessions: { s01: entry } }),
        ),
      ).toThrow();
    }
    expect(() =>
      parseProgress(
        JSON.stringify({
          ...emptyProgress(),
          lastSessionId: "no-such-session",
        }),
      ),
    ).toThrow();
  });
  it("backs up original v1 before first v2 write; leaves it unchanged thereafter", async () => {
    const old = JSON.stringify({
      version: 1,
      attempts: [],
      favorites: [],
      dailyGoal: 3,
      lastDrillId: null,
    });
    const data = new Map([[STORAGE_KEY, old]]);
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    });
    await updateProgress((p) =>
      changeSession(p, "s01", (s) => ({ ...s, step: 1 })),
    );
    expect(data.get(MIGRATION_BACKUP_KEY)).toBe(old);
    expect(JSON.parse(data.get(STORAGE_KEY)!).version).toBe(2);
    await updateProgress((p) => ({ ...p, dailyGoal: 5 }));
    expect(data.get(MIGRATION_BACKUP_KEY)).toBe(old);
  });
  it("does not replace v1 if preserving the backup fails", async () => {
    const old = JSON.stringify({
      version: 1,
      attempts: [],
      favorites: [],
      dailyGoal: 3,
      lastDrillId: null,
    });
    vi.stubGlobal("navigator", {});
    const write = vi.fn((key: string, value: string) => {
      throw new Error(`Quota exceeded: ${key}, ${value.length}`);
    });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === STORAGE_KEY ? old : null),
      setItem: write,
    });
    await expect(updateProgress((p) => p)).rejects.toThrow("Quota");
    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0][0]).toBe(MIGRATION_BACKUP_KEY);
  });
});
