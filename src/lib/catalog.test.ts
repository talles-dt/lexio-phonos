import { expect, it } from "vitest";
import { drills, phonemes } from "./catalog";
import { GET } from "@/app/api/drills/route";
import { retiredApi } from "./retiredApi";
it("every drill references real phonemes with unique positions", () => {
  expect(drills).toHaveLength(12);
  expect(phonemes).toHaveLength(41);
  expect(new Set(drills.map((d) => d.id)).size).toBe(drills.length);
  for (const d of drills) {
    expect(d.targetText.length).toBeGreaterThan(0);
    expect(new Set(d.phonemeSequence.map((p) => p.position)).size).toBe(
      d.phonemeSequence.length,
    );
    for (const p of d.phonemeSequence)
      expect(phonemes.some((x) => x.id === p.phonemeId)).toBe(true);
  }
});
it("filters public catalogue and rejects malformed filters", async () => {
  const res = GET(
    new Request("http://localhost/api/drills?type=MINIMAL_PAIR&difficulty=1"),
  );
  expect(res.status).toBe(200);
  expect(
    (await res.json()).every(
      (d: { drillType: string; difficulty: number }) =>
        d.drillType === "MINIMAL_PAIR" && d.difficulty === 1,
    ),
  ).toBe(true);
  expect(
    GET(new Request("http://localhost/api/drills?difficulty=-1")).status,
  ).toBe(400);
});
it("retired cloud routes return no personal data and cannot be cached", async () => {
  const r = retiredApi();
  expect(r.status).toBe(410);
  expect(r.headers.get("cache-control")).toBe("no-store");
  expect(await r.json()).toHaveProperty("error");
});
