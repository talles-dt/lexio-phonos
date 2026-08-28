// Audio processing types

export interface AudioConfig {
  sampleRate: number;
  frameSize: number;
  bufferSize: number;
  channelCount: number;
}

export interface AudioFrame {
  timestamp: number;
  data: Float32Array;
}

export interface RingBuffer<T> {
  push: (item: T) => void;
  pop: () => T | null;
  peek: () => T | null;
  clear: () => void;
  get length(): number;
  get available(): number;
}

export interface VADConfig {
  threshold: number;
  minSpeechFrames: number;
  minSilenceFrames: number;
  frameDurationMs: number;
}

export interface VADResult {
  isSpeech: boolean;
  startTime: number;
  endTime: number;
  audioData: Float32Array[];
}

export interface AudioFeature {
  rms: number;
  zeroCrossingRate: number;
  spectralCentroid?: number;
  spectralFlatness?: number;
}

export interface FormantResult {
  f1: number;
  f2: number;
  f3: number;
  confidence: number;
  timestamp: number;
}

export interface PitchResult {
  frequency: number;
  confidence: number;
  timestamp: number;
}

export interface AudioAnalysis {
  samples: Float32Array;
  sampleRate: number;
  duration: number;
  rms: number;
  pitchContour: PitchResult[];
  formants: FormantResult[];
  vadSegments: { start: number; end: number }[];
}

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioBuffer: Float32Array[];
  startTime: number | null;
  endTime: number | null;
  error: string | null;
}

export interface AudioStreamConfig {
  sampleRate: number;
  channelCount: number;
  bufferSize: number;
}

// Web Audio API types
export interface AudioWorkletProcessorConfig {
  sampleRate: number;
  bufferSize: number;
  channelCount: number;
}

export interface AudioMessage {
  type: 'audio-data' | 'vad-result' | 'error' | 'stop';
  payload: Record<string, unknown>;
}
