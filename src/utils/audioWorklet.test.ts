import { describe, expect, it } from "vitest";
import vm from "node:vm";
import { AUDIO_WORKLET_PROCESSOR_CODE } from "./audioWorklet";
describe("actual AudioWorklet source", () => {
  function processor(rate: number, maxSeconds = 15) {
    const messages: { type: string; data?: ArrayBuffer }[] = [];
    let Constructor: new (options: unknown) => {
      port: { onmessage: (event: unknown) => void };
      process: (inputs: Float32Array[][]) => boolean;
    };
    vm.runInNewContext(AUDIO_WORKLET_PROCESSOR_CODE, {
      sampleRate: rate,
      Float32Array,
      AudioWorkletProcessor: class {
        port = {
          postMessage: (data: { type: string; data?: ArrayBuffer }) =>
            messages.push(data),
        };
      },
      registerProcessor: (_name: string, cls: typeof Constructor) => {
        Constructor = cls;
      },
    });
    return {
      node: new Constructor!({ processorOptions: { maxSeconds } }),
      messages,
    };
  }
  it("is executable JavaScript and flushes every sample before stop ack", () => {
    const { node, messages } = processor(44100);
    for (let i = 0; i < 17; i++)
      node.process([
        [new Float32Array(128).fill(0.25), new Float32Array(128).fill(0.75)],
      ]);
    node.port.onmessage({ data: "stop" });
    const chunks = messages
      .filter((m) => m.type === "audio-data")
      .map((m) => new Float32Array(m.data!));
    expect(chunks.map((c) => c.length)).toEqual([2048, 128]);
    expect(chunks.every((c) => c.every((x) => x === 0.5))).toBe(true);
    expect(messages.at(-1)?.type).toBe("stopped");
    node.process([[new Float32Array(128)]]);
    expect(messages.length).toBe(3);
  });
  it("caps samples using the real device rate", () => {
    const { node, messages } = processor(44100, 1);
    for (let i = 0; i < 400; i++)
      node.process([[new Float32Array(128).fill(0.5)]]);
    node.port.onmessage({ data: "stop" });
    expect(
      messages
        .filter((m) => m.data)
        .reduce((n, m) => n + new Float32Array(m.data!).length, 0),
    ).toBe(44100);
  });
});
