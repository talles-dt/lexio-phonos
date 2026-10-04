// Runs as JavaScript in the audio rendering thread; never interpolate TypeScript here.
export const AUDIO_WORKLET_PROCESSOR_CODE = `
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.frames = [];
    this.length = 0;
    this.total = 0;
    this.limit = Math.floor(sampleRate * options.processorOptions.maxSeconds);
    this.active = true;
    this.port.onmessage = (event) => {
      if (event.data === 'stop') {
        this.active = false;
        this.flush();
        this.port.postMessage({ type: 'stopped' });
      }
    };
  }
  flush() {
    if (!this.length) return;
    const data = new Float32Array(this.length);
    let offset = 0;
    for (const frame of this.frames) { data.set(frame, offset); offset += frame.length; }
    this.port.postMessage({ type: 'audio-data', data: data.buffer }, [data.buffer]);
    this.frames = []; this.length = 0;
  }
  process(inputs) {
    const channels = inputs[0];
    if (!this.active || !channels || !channels.length) return true;
    const size = Math.min(channels[0].length, this.limit - this.total);
    if (size <= 0) return true;
    const mono = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      for (const channel of channels) mono[i] += channel[i] / channels.length;
    }
    this.frames.push(mono); this.length += size; this.total += size;
    if (this.length >= 2048 || this.total === this.limit) this.flush();
    return true;
  }
}
registerProcessor('audio-capture-processor', AudioCaptureProcessor);
`;

export class AudioCaptureManager {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private chunks: Float32Array[] = [];
  private generation = 0;
  private stopAck: (() => void) | null = null;
  private stopReject: ((error: Error) => void) | null = null;

  constructor(
    private targetSampleRate = 16000,
    private maxSeconds = 15,
  ) {}

  async startRecording(): Promise<void> {
    await this.close();
    const generation = this.generation;
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "Microphone access requires HTTPS and a supported browser.",
      );
    try {
      const context = new AudioContext();
      this.context = context;
      await context.resume();
      if (!context.audioWorklet)
        throw new Error(
          "This browser does not support audio recording. Try a current Chrome, Firefox or Safari.",
        );
      const url = URL.createObjectURL(
        new Blob([AUDIO_WORKLET_PROCESSOR_CODE], { type: "text/javascript" }),
      );
      try {
        await context.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      if (generation !== this.generation)
        throw new Error("Recording cancelled.");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Recording cancelled.");
      }
      this.stream = stream;
      this.chunks = [];
      this.source = context.createMediaStreamSource(stream);
      this.node = new AudioWorkletNode(context, "audio-capture-processor", {
        processorOptions: { maxSeconds: this.maxSeconds },
      });
      this.node.port.onmessage = ({ data }) => {
        if (data.type === "audio-data")
          this.chunks.push(new Float32Array(data.data));
        if (data.type === "stopped") this.stopAck?.();
      };
      this.source.connect(this.node);
      // Processor leaves its output silent; this keeps it pulled without microphone feedback.
      this.node.connect(context.destination);
    } catch (error) {
      if (generation === this.generation) await this.close();
      throw error;
    }
  }

  async stopRecording(): Promise<Float32Array> {
    const node = this.node;
    const sourceRate = this.context?.sampleRate;
    if (!node || !sourceRate) throw new Error("No recording is active.");
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () =>
            reject(
              new Error(
                "The microphone stopped responding. Please record again.",
              ),
            ),
          2000,
        );
        this.stopReject = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
        this.stopAck = () => {
          clearTimeout(timeout);
          resolve();
        };
        node.port.postMessage("stop");
      });
      // MessagePort preserves ordering: all chunks, including the last partial chunk, precede the ack.
      const samples = new Float32Array(
        this.chunks.reduce((sum, chunk) => sum + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of this.chunks) {
        samples.set(chunk, offset);
        offset += chunk.length;
      }
      this.stopReject = null;
      await this.close();
      if (sourceRate === this.targetSampleRate || !samples.length)
        return samples;
      const outputLength = Math.round(
        (samples.length * this.targetSampleRate) / sourceRate,
      );
      const offline = new OfflineAudioContext(
        1,
        Math.max(1, outputLength),
        this.targetSampleRate,
      );
      const buffer = offline.createBuffer(1, samples.length, sourceRate);
      buffer.copyToChannel(samples, 0);
      const source = offline.createBufferSource();
      source.buffer = buffer;
      source.connect(offline.destination);
      source.start();
      return new Float32Array(
        (await offline.startRendering()).getChannelData(0),
      );
    } finally {
      await this.close();
    }
  }

  async close(): Promise<void> {
    this.generation++;
    this.stopReject?.(new Error("Recording cancelled."));
    this.stopReject = null;
    this.stopAck = null;
    this.source?.disconnect();
    this.source = null;
    if (this.node) {
      this.node.port.onmessage = null;
      this.node.port.close();
      this.node.disconnect();
    }
    this.node = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
    this.chunks = [];
  }
}
