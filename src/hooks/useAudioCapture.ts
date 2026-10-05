"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioCaptureManager } from "@/utils/audioWorklet";
import { pcmToWav } from "@/utils/audio";

export interface CapturedAudio {
  blob: Blob;
  url: string;
  samples: Float32Array;
  sampleRate: number;
}
interface Options {
  locale?: "en" | "pt-BR";
  targetSampleRate?: number;
  onRecordingStart?: () => void;
  onRecordingStop?: (audio: CapturedAudio) => void | Promise<void>;
}
const initial = {
  phase: "idle" as "idle" | "starting" | "recording" | "processing",
  audioUrl: null as string | null,
  duration: 0,
  error: null as string | null,
};
export function useAudioCapture(options: Options = {}) {
  const [state, setState] = useState(initial);
  const callbacks = useRef(options);
  useEffect(() => {
    callbacks.current = options;
  });
  const manager = useRef<AudioCaptureManager | null>(null);
  const phase = useRef(initial.phase);
  const mounted = useRef(true);
  const generation = useRef(0);
  const objectUrl = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const limit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimers = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (limit.current) clearTimeout(limit.current);
  }, []);
  const revoke = useCallback(() => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }, []);
  useEffect(() => {
    mounted.current = true;
    const lifecycle = generation;
    return () => {
      mounted.current = false;
      lifecycle.current++;
      clearTimers();
      revoke();
      void manager.current?.close();
    };
  }, [clearTimers, revoke]);
  const fail = useCallback(
    (error: unknown) => {
      clearTimers();
      phase.current = "idle";
      let message =
        error instanceof Error
          ? error.message
          : "Recording failed. Please try again.";
      if (error instanceof Error && error.name === "NotAllowedError")
        message =
          "Microphone permission was denied. Allow the microphone in your browser site settings, then try again.";
      if (error instanceof Error && error.name === "NotFoundError")
        message = "No microphone found. Connect a microphone and try again.";
      if (error instanceof Error && error.name === "NotReadableError")
        message =
          "The microphone is busy or unavailable. Close other recording apps and try again.";
      if (callbacks.current.locale === "pt-BR") {
        const name = error instanceof Error ? error.name : "";
        message =
          name === "NotAllowedError"
            ? "Acesso ao microfone negado. Autorize o microfone nas configurações deste site e tente novamente."
            : name === "NotFoundError"
              ? "Nenhum microfone encontrado. Conecte um microfone e tente novamente."
              : name === "NotReadableError"
                ? "O microfone está ocupado ou indisponível. Feche outros aplicativos de gravação e tente novamente."
                : "Não foi possível concluir a gravação. Verifique o microfone e tente novamente em um navegador atualizado, usando HTTPS.";
      }
      if (mounted.current)
        setState((prev) => ({ ...prev, phase: "idle", error: message }));
    },
    [clearTimers],
  );
  const stopRecording = useCallback(async () => {
    if (phase.current !== "recording") return;
    phase.current = "processing";
    clearTimers();
    setState((prev) => ({ ...prev, phase: "processing" }));
    const run = generation.current;
    try {
      const samples = await manager.current!.stopRecording();
      if (!mounted.current || run !== generation.current) return;
      const sampleRate = callbacks.current.targetSampleRate ?? 16000;
      const blob = pcmToWav(samples, sampleRate);
      revoke();
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;
      setState((prev) => ({
        ...prev,
        audioUrl: url,
        duration: samples.length / sampleRate,
      }));
      await callbacks.current.onRecordingStop?.({
        blob,
        url,
        samples,
        sampleRate,
      });
      if (mounted.current && run === generation.current) {
        phase.current = "idle";
        setState((prev) => ({ ...prev, phase: "idle" }));
      }
    } catch (error) {
      if (run === generation.current) fail(error);
    }
  }, [clearTimers, fail, revoke]);
  const startRecording = useCallback(async () => {
    if (phase.current !== "idle") return;
    phase.current = "starting";
    const run = ++generation.current;
    revoke();
    setState({ ...initial, phase: "starting" });
    manager.current = new AudioCaptureManager(
      callbacks.current.targetSampleRate ?? 16000,
      15,
    );
    try {
      await manager.current.startRecording();
      if (!mounted.current || run !== generation.current) return;
      phase.current = "recording";
      setState((prev) => ({ ...prev, phase: "recording" }));
      callbacks.current.onRecordingStart?.();
      const started = performance.now();
      timer.current = setInterval(
        () =>
          setState((prev) => ({
            ...prev,
            duration: Math.min(15, (performance.now() - started) / 1000),
          })),
        100,
      );
      limit.current = setTimeout(() => {
        void stopRecording();
      }, 15000);
    } catch (error) {
      if (run === generation.current) fail(error);
    }
  }, [fail, revoke, stopRecording]);
  const clearRecording = useCallback(() => {
    generation.current++;
    clearTimers();
    revoke();
    void manager.current?.close();
    phase.current = "idle";
    setState(initial);
  }, [clearTimers, revoke]);
  return {
    ...state,
    isStarting: state.phase === "starting",
    isRecording: state.phase === "recording",
    isProcessing: state.phase === "processing",
    startRecording,
    stopRecording,
    clearRecording,
  };
}
