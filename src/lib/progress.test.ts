import { describe, expect, it } from "vitest";
import {
  addAttempt,
  emptyProgress,
  mergeProgress,
  parseProgress,
  reviewDrillIds,
} from "./progress";
const attempt = {
  id: "test-1",
  drillId: "sheep-ship",
  createdAt: "2026-10-04T03:00:00.000Z",
  durationSeconds: 1,
  reflection: "again" as const,
};
describe("practice data contract", () => {
  it("round-trips history without audio or grades", () => {
    const p = addAttempt(emptyProgress(), attempt);
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    expect(p.lastDrillId).toBe("sheep-ship");
  });
  it("rejects damaged, unsupported and non-finite data", () => {
    for (const value of [
      "{}",
      "null",
      "not json",
      JSON.stringify({ ...emptyProgress(), version: 99 }),
      JSON.stringify({
        ...emptyProgress(),
        attempts: [{ ...attempt, durationSeconds: null }],
      }),
      JSON.stringify({ ...emptyProgress(), favorites: ["unknown"] }),
    ])
      expect(() => parseProgress(value)).toThrow();
  });
  it("merges idempotently and preserves existing reflection", () => {
    const p = addAttempt(emptyProgress(), attempt);
    const imported = {
      ...p,
      attempts: [{ ...attempt, reflection: "comfortable" as const }],
    };
    expect(mergeProgress(p, imported).attempts).toEqual([attempt]);
    expect(mergeProgress(p, p)).toEqual(p);
  });
  it("review reflects the latest take, not a permanent mastery judgment", () => {
    let p = addAttempt(emptyProgress(), attempt);
    expect(reviewDrillIds(p).has(attempt.drillId)).toBe(true);
    p = addAttempt(p, {
      ...attempt,
      id: "test-2",
      createdAt: "2026-10-04T04:00:00.000Z",
      reflection: "comfortable",
    });
    expect(reviewDrillIds(p).size).toBe(0);
  });
});
