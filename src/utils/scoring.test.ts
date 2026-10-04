import { describe, expect, it } from "vitest";
import { observeAudio } from "./scoring";
import { detectPitch } from "./audio";
function tone(seconds = 1, frequency = 150, amplitude = 0.25) {
  return Float32Array.from(
    { length: Math.floor(16000 * seconds) },
    (_, i) => amplitude * Math.sin((2 * Math.PI * frequency * i) / 16000),
  );
}
describe("honest acoustic observations", () => {
  it("rejects silent, short, clipped and invalid audio without awarding a score", () => {
    const cases = [
      [new Float32Array(16000), "silent"],
      [tone(0.1), "too_short"],
      [new Float32Array(16000).fill(1), "clipped"],
      [new Float32Array([NaN]), "invalid"],
    ] as const;
    for (const [samples, quality] of cases) {
      const o = observeAudio(samples, 16000);
      expect(o.quality).toBe(quality);
      expect(o.pronunciationScore).toBeNull();
      expect(o.formants).toEqual([]);
    }
  });
  it("rejects invalid rates and unbounded recordings", () => {
    expect(observeAudio(tone(), 0).quality).toBe("invalid");
    expect(observeAudio(tone(), NaN).quality).toBe("invalid");
    expect(observeAudio(tone(16), 16000).quality).toBe("invalid");
  });
  it("measures sound without claiming it contains the correct words", () => {
    const o = observeAudio(tone(), 16000);
    expect(o.quality).toBe("usable");
    expect(o.durationSeconds).toBe(1);
    expect(o.pronunciationScore).toBeNull();
    expect(o.message).toContain("does not confirm");
    expect(JSON.stringify(o)).not.toContain("NaN");
    expect(o.pitchContour.length).toBeGreaterThan(0);
  });
  it("estimates a known fundamental rather than choosing lag one", () => {
    const p = detectPitch(tone(0.13), 16000);
    expect(p).not.toBeNull();
    expect(p!.frequency).toBeGreaterThan(145);
    expect(p!.frequency).toBeLessThan(155);
  });
});
