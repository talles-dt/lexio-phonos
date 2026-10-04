import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
export default function setup() {
  // Deterministic synthetic voiced-like fixture, not a human pronunciation reference.
  const rate = 48000,
    length = rate * 4;
  const wav = Buffer.alloc(44 + length * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(length * 2, 40);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const signal =
      0.2 * Math.sin(2 * Math.PI * 150 * t) +
      0.07 * Math.sin(2 * Math.PI * 300 * t);
    wav.writeInt16LE(Math.round(signal * 32767), 44 + i * 2);
  }
  mkdirSync(".test-assets", { recursive: true });
  writeFileSync(resolve(".test-assets/microphone.wav"), wav);
}
