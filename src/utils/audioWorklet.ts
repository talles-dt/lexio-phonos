// AudioWorklet processor for low-latency audio capture

// This file contains the AudioWorklet processor code that runs on the audio thread

const AUDIO_WORKLET_PROCESSOR_CODE = `
class AudioCaptureProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array[] = [];
  private bufferSize: number;
  private sampleRate: number;
  private isRecording: boolean = false;
  private frameCount: number = 0;

  constructor(options: any) {
    super();
    this.bufferSize = options.processorOptions.bufferSize || 4096;
    this.sampleRate = options.processorOptions.sampleRate || 48000;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    if (!this.isRecording) {
      return true;
    }

    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    // Convert stereo to mono if needed
    const mono = new Float32Array(input[0].length);
    for (let i = 0; i < input[0].length; i++) {
      let sum = 0;
      for (let j = 0; j < input.length; j++) {
        sum += input[j][i];
      }
      mono[i] = sum / input.length;
    }

    // Store frame
    this.buffer.push(mono);
    this.frameCount += mono.length;

    // Send data to main thread in chunks
    if (this.buffer.length >= 4) {
      const chunk = this.buffer.splice(0, 4);
      const combined = new Float32Array(chunk.reduce((sum, f) => sum + f.length, 0));
      let offset = 0;
      for (const frame of chunk) {
        combined.set(frame, offset);
        offset += frame.length;
      }

      this.port.postMessage({
        type: 'audio-data',
        data: combined.buffer,
        timestamp: this.frameCount - combined.length,
        sampleRate: this.sampleRate,
      }, [combined.buffer]);
    }

    return true;
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'isRecording',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate',
      },
    ];
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
`;

// Register the worklet in the browser
export async function registerAudioWorklet(audioContext: AudioContext): Promise<void> {
  try {
    const blob = new Blob([AUDIO_WORKLET_PROCESSOR_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    if (audioContext.audioWorklet) {
      try {
        await audioContext.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        return;
      } catch {
        // not registered yet, fallback to registering fresh
      }
    }

    await audioContext.audioWorklet?.addModule(url);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to register AudioWorklet:', error);
    throw error;
  }
}

// Create audio capture node
export function createAudioCaptureNode(
  audioContext: AudioContext,
  onAudioData: (data: Float32Array, timestamp: number, sampleRate: number) => void,
  bufferSize: number = 4096
): AudioWorkletNode {
  const node = new AudioWorkletNode(
    audioContext,
    'audio-capture-processor',
    {
      processorOptions: {
        bufferSize,
        sampleRate: audioContext.sampleRate,
      },
    }
  );

  node.port.onmessage = (event) => {
    if (event.data.type === 'audio-data') {
      const data = new Float32Array(event.data.data);
      onAudioData(data, event.data.timestamp, event.data.sampleRate);
    }
  };

  return node;
}

// Audio capture manager
export class AudioCaptureManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isRecording: boolean = false;
  private audioBuffer: Float32Array[] = [];
  private startTime: number = 0;
  private sampleRate: number = 48000;
  private targetSampleRate: number = 16000;

  constructor(targetSampleRate: number = 16000) {
    this.targetSampleRate = targetSampleRate;
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        await registerAudioWorklet(this.audioContext);
      }

      // Get media stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: this.sampleRate,
        },
      });

      // Create source node
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create worklet node
      this.workletNode = createAudioCaptureNode(
        this.audioContext,
        (data, timestamp) => this.handleAudioData(data, timestamp),
        4096
      );

      // Connect nodes
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);

      // Start recording
      this.isRecording = true;
      this.audioBuffer = [];
      this.startTime = performance.now();

      console.log('Audio recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      throw error;
    }
  }

  stopRecording(): Float32Array {
    if (!this.isRecording) {
      console.warn('Not recording');
      return new Float32Array();
    }

    this.isRecording = false;

    // Disconnect nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    // Combine all buffers
    const totalLength = this.audioBuffer.reduce((sum, b) => sum + b.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const buffer of this.audioBuffer) {
      combined.set(buffer, offset);
      offset += buffer.length;
    }

    // Downsample if needed
    if (this.sampleRate !== this.targetSampleRate) {
      const downsampled = this.downsample(combined, this.sampleRate, this.targetSampleRate);
      this.cleanup();
      return downsampled;
    }

    this.cleanup();
    return combined;
  }

  private handleAudioData(data: Float32Array, timestamp: number): void {
    if (this.isRecording) {
      this.audioBuffer.push(data);
    }
  }

  private downsample(
    source: Float32Array,
    sourceRate: number,
    targetRate: number
  ): Float32Array {
    const ratio = sourceRate / targetRate;
    const targetLength = Math.floor(source.length / ratio);
    const result = new Float32Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      let sum = 0;
      for (let j = start; j < end && j < source.length; j++) {
        sum += source[j];
      }
      result[i] = sum / Math.max(1, end - start);
    }

    return result;
  }

  private cleanup(): void {
    this.isRecording = false;
    this.audioBuffer = [];

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      // Don't close the audio context as it might be reused
      // this.audioContext.close();
    }
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }

  async close(): Promise<void> {
    this.cleanup();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export types
export interface AudioWorkletMessage {
  type: 'audio-data' | 'error';
  data?: Float32Array;
  timestamp?: number;
  sampleRate?: number;
  error?: string;
}
