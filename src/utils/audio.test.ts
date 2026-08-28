import { describe, it, expect } from 'vitest';
import { EnergyVAD } from './audio';

describe('EnergyVAD', () => {
  it('detects speech after minSpeechFrames consecutive frames', () => {
    // EnergyVAD is stateful: a single high-energy frame does not immediately
    // return true — it waits until minSpeechFrames consecutive frames exceed
    // the threshold before setting inSpeech = true.
    const vad = new EnergyVAD({ threshold: -40, minSpeechFrames: 2, minSilenceFrames: 3 });

    // Build a 1024-sample frame with RMS ~0.35 => -9 dBFS, well above -40 dB.
    const makeSpeechFrame = () => {
      const frame = new Float32Array(1024);
      for (let i = 0; i < frame.length; i++) {
        frame[i] = (Math.random() * 2 - 1) * 0.5;
      }
      return frame;
    };

    // First frame: starts counting, but still false.
    expect(vad.process(makeSpeechFrame())).toBe(false);
    // Second consecutive frame: crosses minSpeechFrames, enters speech.
    expect(vad.process(makeSpeechFrame())).toBe(true);
  });

  it('detects silence after minSilenceFrames of low energy', () => {
    const vad = new EnergyVAD({ threshold: -30, minSpeechFrames: 1, minSilenceFrames: 2 });

    // One high-energy frame to enter speech.
    const hi = new Float32Array(1024);
    for (let i = 0; i < hi.length; i++) hi[i] = 0.5;
    expect(vad.process(hi)).toBe(true);

    // Two silent frames should bring it out.
    const silent = new Float32Array(1024);
    expect(vad.process(silent)).toBe(true);  // still in speech during first silence frame
    expect(vad.process(silent)).toBe(false); // exits after minSilenceFrames
  });

  it('returns false for fully silent frame when not inSpeech', () => {
    const vad = new EnergyVAD({ threshold: -30, minSpeechFrames: 2, minSilenceFrames: 2 });
    const silent = new Float32Array(1024);
    expect(vad.process(silent)).toBe(false);
  });
});
