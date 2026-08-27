// Hook for audio capture and recording

import { useState, useCallback, useEffect, useRef } from 'react';
import { AudioCaptureManager } from '@/utils/audioWorklet';
import { pcmToWav } from '@/utils/audio';

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioBuffer: Float32Array[];
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  error: string | null;
}

interface UseAudioCaptureOptions {
  targetSampleRate?: number;
  onRecordingStart?: () => void;
  onRecordingStop?: (audioData: { blob: Blob; url: string; samples: Float32Array }) => void;
  onError?: (error: string) => void;
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}) {
  const { 
    targetSampleRate = 16000,
    onRecordingStart,
    onRecordingStop,
    onError,
  } = options;

  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    audioBuffer: [],
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    error: null,
  });

  const audioCaptureRef = useRef<AudioCaptureManager | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Initialize audio capture manager
  useEffect(() => {
    audioCaptureRef.current = new AudioCaptureManager(targetSampleRate);

    return () => {
      if (audioCaptureRef.current) {
        audioCaptureRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [targetSampleRate]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (state.isRecording) {
        console.warn('Already recording');
        return;
      }

      setState(prev => ({ ...prev, isRecording: true, error: null }));
      startTimeRef.current = Date.now();

      // Start timer
      timerRef.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: (Date.now() - startTimeRef.current) / 1000,
        }));
      }, 100);

      await audioCaptureRef.current?.startRecording();
      onRecordingStart?.();

      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([15]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ ...prev, isRecording: false, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [state.isRecording, onRecordingStart, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      if (!state.isRecording) {
        console.warn('Not recording');
        return;
      }

      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const samples = audioCaptureRef.current?.stopRecording() || new Float32Array();

      // Convert to WAV and create blob URL
      const blob = pcmToWav(samples, targetSampleRate);
      const url = URL.createObjectURL(blob);

      // Update state
      setState(prev => ({
        ...prev,
        isProcessing: false,
        audioBlob: blob,
        audioUrl: url,
        duration: samples.length / targetSampleRate,
      }));

      // Callback with audio data
      onRecordingStop?.({ blob, url, samples });

      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      setState(prev => ({ ...prev, isProcessing: false, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [state.isRecording, targetSampleRate, onRecordingStop, onError]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    // For now, just stop and restart
    if (state.isRecording) {
      stopRecording();
    }
  }, [state.isRecording, stopRecording]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    setState({
      isRecording: false,
      isProcessing: false,
      audioBuffer: [],
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      error: null,
    });
  }, [state.audioUrl]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    clearRecording,
    toggleRecording,
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    audioBlob: state.audioBlob,
    audioUrl: state.audioUrl,
    duration: state.duration,
    error: state.error,
  };
}
