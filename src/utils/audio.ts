// Audio processing utilities

import { AudioConfig, AudioFrame, RingBuffer, VADConfig, AudioFeature, FormantResult, PitchResult } from '@/types/audio';

// Default audio configuration
const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  frameSize: 1024,
  bufferSize: 4096,
  channelCount: 1,
};

// Ring Buffer implementation for audio data
export class AudioRingBuffer<T> implements RingBuffer<T> {
  private buffer: (T | null)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  constructor(size: number) {
    this.buffer = new Array(size).fill(null);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.buffer.length;
    if (this.count < this.buffer.length) {
      this.count++;
    } else {
      this.tail = (this.tail + 1) % this.buffer.length;
    }
  }

  pop(): T | null {
    if (this.count === 0) return null;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = null;
    this.tail = (this.tail + 1) % this.buffer.length;
    this.count--;
    return item;
  }

  peek(): T | null {
    if (this.count === 0) return null;
    return this.buffer[this.tail];
  }

  clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  get length(): number {
    return this.buffer.length;
  }

  get available(): number {
    return this.count;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.tail + i) % this.buffer.length;
      if (this.buffer[idx] !== null) {
        result.push(this.buffer[idx]!);
      }
    }
    return result;
  }
}

// Simple VAD based on energy threshold
export class EnergyVAD {
  private threshold: number;
  private minSpeechFrames: number;
  private minSilenceFrames: number;
  private speechCount: number = 0;
  private silenceCount: number = 0;
  private inSpeech: boolean = false;

  constructor(config: Partial<VADConfig> = {}) {
    this.threshold = config.threshold ?? -50; // dB
    this.minSpeechFrames = config.minSpeechFrames ?? 5;
    this.minSilenceFrames = config.minSilenceFrames ?? 10;
  }

  process(frame: Float32Array): boolean {
    const rms = this.calculateRMS(frame);
    const energyDb = this.rmsToDb(rms);
    const isSpeech = energyDb > this.threshold;

    if (isSpeech) {
      this.speechCount++;
      this.silenceCount = 0;
      if (this.speechCount >= this.minSpeechFrames) {
        this.inSpeech = true;
      }
    } else {
      this.silenceCount++;
      this.speechCount = 0;
      if (this.inSpeech && this.silenceCount >= this.minSilenceFrames) {
        this.inSpeech = false;
      }
    }

    return this.inSpeech;
  }

  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  private rmsToDb(rms: number): number {
    if (rms === 0) return -Infinity;
    return 20 * Math.log10(rms);
  }

  reset(): void {
    this.speechCount = 0;
    this.silenceCount = 0;
    this.inSpeech = false;
  }
}

// Downsample audio to target sample rate
export function downsampleAudio(
  source: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  const ratio = sourceSampleRate / targetSampleRate;
  const targetLength = Math.floor(source.length / ratio);
  const result = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += source[j];
    }
    result[i] = sum / (end - start);
  }

  return result;
}

// Convert stereo to mono
export function stereoToMono(
  left: Float32Array,
  right: Float32Array
): Float32Array {
  const length = Math.min(left.length, right.length);
  const mono = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }
  return mono;
}

// Normalize audio to [-1, 1] range
export function normalizeAudio(
  samples: Float32Array,
  targetMax: number = 0.99
): Float32Array {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > max) max = abs;
  }

  if (max === 0) return samples;

  const normalized = new Float32Array(samples.length);
  const scale = targetMax / max;
  for (let i = 0; i < samples.length; i++) {
    normalized[i] = samples[i] * scale;
  }
  return normalized;
}

// Apply pre-emphasis filter (for formant extraction)
export function preEmphasis(
  samples: Float32Array,
  coefficient: number = 0.97
): Float32Array {
  const result = new Float32Array(samples.length);
  result[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    result[i] = samples[i] - coefficient * samples[i - 1];
  }
  return result;
}

// Calculate autocorrelation for pitch detection
export function autocorrelation(
  samples: Float32Array,
  maxLag: number = 1000
): Float32Array {
  const n = samples.length;
  const result = new Float32Array(maxLag);

  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += samples[i] * samples[i + lag];
    }
    result[lag] = sum;
  }

  return result;
}

// Simple pitch detection using autocorrelation with V/UV decision
export function detectPitch(
  samples: Float32Array,
  sampleRate: number = 16000
): PitchResult | null {
  const preEmphasized = preEmphasis(samples);
  const autocorr = autocorrelation(preEmphasized, Math.floor(sampleRate / 50));

  if (autocorr.length < 2 || autocorr[0] <= 0) return null;

  let maxCorr = -Infinity;
  let maxLag = 0;

  // Skip lag 0 (self-correlation)
  for (let lag = 1; lag < autocorr.length; lag++) {
    if (autocorr[lag] > maxCorr) {
      maxCorr = autocorr[lag];
      maxLag = lag;
    }
  }

  // Salience threshold: peak must be a meaningful fraction of zero-lag energy
  const salience = maxCorr / autocorr[0];
  if (salience < 0.3) return null;

  // V/UV decision via zero-crossing rate: voiced frames have lower ZCR
  const zcr = calculateZeroCrossingRate(preEmphasized);
  // Typical voiced speech ZCR < 0.15 at 16kHz; unvoiced fricatives exceed it
  if (zcr > 0.15) return null;

  const frequency = sampleRate / maxLag;

  // Sanity bounds: human voice fundamental roughly 50–1000 Hz
  if (frequency < 50 || frequency > 1000) return null;

  const confidence = Math.min(1, salience);

  return {
    frequency,
    confidence,
    timestamp: 0,
  };
}

// Calculate RMS
export function calculateRMS(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

// Calculate zero-crossing rate
export function calculateZeroCrossingRate(samples: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i - 1] < 0 && samples[i] >= 0) || (samples[i - 1] >= 0 && samples[i] < 0)) {
      crossings++;
    }
  }
  return crossings / samples.length;
}

// Simple LPC (Linear Predictive Coding) for formant extraction
export function lpc(
  samples: Float32Array,
  order: number = 12
): Float32Array {
  const n = samples.length;
  const autocorr = autocorrelation(samples, order + 1);

  // Solve Yule-Walker equations using Levinson-Durbin
  const a = new Float32Array(order + 1);
  a[0] = 1;

  let error = autocorr[0];

  for (let i = 1; i <= order; i++) {
    let sum = 0;
    for (let j = 1; j <= i - 1; j++) {
      sum += a[j] * autocorr[i - j];
    }

    const k = (autocorr[i] - sum) / error;
    a[i] = k;

    for (let j = 1; j <= Math.floor(i / 2); j++) {
      const temp = a[j];
      a[j] = temp - k * a[i - j];
      a[i - j] = temp - k * a[i - j];
    }

    error *= (1 - k * k);
  }

  return a;
}

// Find formant frequencies from LPC coefficients
export function findFormants(
  lpcCoeffs: Float32Array,
  sampleRate: number = 16000
): FormantResult {
  const roots = findPolynomialRoots([...lpcCoeffs].reverse());

  // Filter real roots and convert to frequencies
  const frequencies: number[] = [];
  for (const root of roots) {
    if (root.im !== 0) {
      // Complex conjugate pairs
      const angle = Math.atan2(root.im, root.re);
      const frequency = (angle * sampleRate) / (2 * Math.PI);
      if (frequency > 0 && frequency < sampleRate / 2) {
        frequencies.push(frequency);
      }
    }
  }

  // Sort by frequency
  frequencies.sort((a, b) => a - b);

  // Return first 3 formants (F1, F2, F3)
  const f1 = frequencies[0] || 0;
  const f2 = frequencies[1] || 0;
  const f3 = frequencies[2] || 0;

  return {
    f1,
    f2,
    f3,
    confidence: frequencies.length >= 3 ? 1.0 : frequencies.length / 3,
    timestamp: 0,
  };
}

// Simple polynomial root finding (Durand-Kerner method)
interface Complex {
  re: number;
  im: number;
}

function findPolynomialRoots(coeffs: number[]): Complex[] {
  const degree = coeffs.length - 1;
  const roots: Complex[] = [];

  // Initial guesses
  for (let i = 0; i < degree; i++) {
    const angle = (2 * Math.PI * i) / degree;
    roots.push({
      re: 0.4 * Math.cos(angle),
      im: 0.4 * Math.sin(angle),
    });
  }

  // Durand-Kerner iteration
  const maxIterations = 100;
  const tolerance = 1e-10;

  for (let iter = 0; iter < maxIterations; iter++) {
    let maxDiff = 0;

    for (let i = 0; i < degree; i++) {
      let numeratorRe = coeffs[0];
      let numeratorIm = 0;

      for (let j = 1; j <= degree; j++) {
        if (j <= i) continue;

        let productRe = coeffs[j];
        let productIm = 0;

        for (let k = 0; k < degree; k++) {
          if (k === i) continue;
          const rk = roots[k];
          const tempRe = productRe * rk.re - productIm * rk.im;
          const tempIm = productRe * rk.im + productIm * rk.re;
          productRe = tempRe;
          productIm = tempIm;
        }

        numeratorRe += productRe;
        numeratorIm += productIm;
      }

      const denominatorRe = roots[i].re;
      const denominatorIm = roots[i].im;
      const denomMag = denominatorRe * denominatorRe + denominatorIm * denominatorIm;

      if (denomMag < tolerance) continue;

      const newRe = (numeratorRe * denominatorRe + numeratorIm * denominatorIm) / denomMag;
      const newIm = (numeratorIm * denominatorRe - numeratorRe * denominatorIm) / denomMag;

      const diff = Math.sqrt(
        (newRe - roots[i].re) ** 2 + (newIm - roots[i].im) ** 2
      );
      maxDiff = Math.max(maxDiff, diff);

      roots[i] = { re: newRe, im: newIm };
    }

    if (maxDiff < tolerance) break;
  }

  return roots;
}

// Extract audio features
export function extractAudioFeatures(
  samples: Float32Array
): AudioFeature {
  const rms = calculateRMS(samples);
  const zcr = calculateZeroCrossingRate(samples);

  return {
    rms,
    zeroCrossingRate: zcr,
  };
}

// Frame audio into chunks
export function frameAudio(
  samples: Float32Array,
  frameSize: number = 1024,
  hopSize: number = 512
): Float32Array[] {
  const frames: Float32Array[] = [];
  const n = samples.length;

  for (let i = 0; i < n - frameSize + 1; i += hopSize) {
    const frame = samples.slice(i, i + frameSize);
    frames.push(frame);
  }

  return frames;
}

// Window function (Hamming)
export function hammingWindow(size: number): Float32Array {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
  }
  return window;
}

// Apply window to frame
export function applyWindow(
  frame: Float32Array,
  window: Float32Array
): Float32Array {
  const result = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    result[i] = frame[i] * window[i];
  }
  return result;
}

// Convert PCM to WAV blob
export function pcmToWav(
  samples: Float32Array,
  sampleRate: number = 16000,
  channelCount: number = 1
): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // Write WAV header
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * 2, true);
  view.setUint16(32, channelCount * 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write sample data (convert Float32 to Int16)
  const dataOffset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const int16 = Math.floor(sample * 32767);
    view.setInt16(dataOffset + i * 2, int16, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Convert WAV blob to PCM samples
export async function wavToPcm(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const view = new DataView(arrayBuffer);

  // Check RIFF header
  if (view.getUint32(0, true) !== 0x46464952) {
    throw new Error('Not a valid WAV file');
  }

  // Find data chunk
  let offset = 12;
  while (offset < arrayBuffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'data') {
      const sampleCount = chunkSize / 2;
      const samples = new Float32Array(sampleCount);

      for (let i = 0; i < sampleCount; i++) {
        const int16 = view.getInt16(offset + 8 + i * 2, true);
        samples[i] = int16 / 32768.0;
      }

      return samples;
    }

    offset += 8 + chunkSize;
  }

  throw new Error('No data chunk found in WAV file');
}


