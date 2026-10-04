"use client";
import { useEffect, useState } from "react";
import type { Drill } from "@/types/pronunciation";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import type { AudioObservation } from "@/utils/scoring";
import { analyzeInWorker } from "@/utils/analyzeInWorker";
import { VowelChart } from "./VowelChart";
import { PitchContour } from "./PitchContour";
import ReferencePlayer from "./ReferencePlayer";
import { categoryLabels } from "@/lib/catalog";
import type { Reflection } from "@/lib/progress";

interface Props {
  drill: Drill;
  onComplete: (durationSeconds: number) => Promise<string | null>;
  onReflect: (id: string, reflection: Reflection) => Promise<boolean>;
  onBusy: (busy: boolean) => void;
  onNext: () => void;
}
export default function DrillCard({
  drill,
  onComplete,
  onReflect,
  onBusy,
  onNext,
}: Props) {
  const [observation, setObservation] = useState<AudioObservation | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [reflection, setReflection] = useState<Reflection>("unreviewed");
  const capture = useAudioCapture({
    onRecordingStart: () => {
      setObservation(null);
      setAttemptId(null);
      setReflection("unreviewed");
    },
    onRecordingStop: async ({ samples, sampleRate }) => {
      const result = await analyzeInWorker(samples, sampleRate);
      setObservation(result);
      if (result.quality === "usable")
        setAttemptId(await onComplete(result.durationSeconds));
      onBusy(false);
    },
  });
  const busy =
    capture.isStarting || capture.isRecording || capture.isProcessing;
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);
  async function record() {
    if (capture.isRecording) {
      await capture.stopRecording();
      onBusy(false);
      return;
    }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    document.querySelectorAll("audio").forEach((audio) => audio.pause());
    setObservation(null);
    setAttemptId(null);
    onBusy(true);
    await capture.startRecording();
    // Capture state keeps navigation disabled until processing finishes.
  }
  function clear() {
    capture.clearRecording();
    setObservation(null);
    setAttemptId(null);
    onBusy(false);
  }
  async function reflect(value: Reflection) {
    if (attemptId && (await onReflect(attemptId, value))) setReflection(value);
  }
  return (
    <article className="panel space-y-6" aria-labelledby="practice-title">
      <div>
        <p className="eyebrow">
          {categoryLabels[drill.drillType]} · Level {drill.difficulty}
        </p>
        <h2 id="practice-title" className="text-2xl font-bold mt-2">
          {drill.title}
        </h2>
      </div>
      <section aria-labelledby="target-label" className="target-box">
        <h3 id="target-label" className="eyebrow">
          Say these words
        </h3>
        <p className="text-3xl sm:text-4xl my-3" lang="en">
          {drill.targetText}
        </p>
        <p className="muted" lang="en-fonipa">
          /{drill.targetIpa}/
        </p>
        <details className="text-sm mt-3">
          <summary>What do these symbols mean?</summary>
          <p className="mt-2 muted">
            The International Phonetic Alphabet (IPA) shows sounds. ˈ marks
            primary stress, ˌ secondary stress, ː a long vowel and ə the relaxed
            vowel in an unstressed syllable. English pronunciations vary by
            accent.
          </p>
        </details>
      </section>
      <section aria-labelledby="listen-title">
        <h3 id="listen-title" className="step-title">
          1. Listen and prepare
        </h3>
        <p className="mb-3">{drill.description}</p>
        {drill.accentNote && (
          <p className="muted text-sm mb-3">
            {drill.accentNote}{" "}
            {drill.referenceSourceUrl && (
              <a
                className="underline"
                href={drill.referenceSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Dictionary reference (opens a new tab)
              </a>
            )}
          </p>
        )}
        <ReferencePlayer text={drill.targetText} disabled={busy} />
      </section>
      <section aria-labelledby="record-title">
        <h3 id="record-title" className="step-title">
          2. Record yourself
        </h3>
        <p className="muted text-sm mb-3">
          Find a quiet place. Say the target once, then stop. Limit: 15 seconds.
          Your voice stays on this device.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={capture.isRecording ? "danger" : "primary"}
            disabled={capture.isStarting || capture.isProcessing}
            onClick={() => void record()}
          >
            {capture.isStarting
              ? "Waiting for microphone…"
              : capture.isProcessing
                ? "Processing…"
                : capture.isRecording
                  ? "Stop recording"
                  : "Start recording"}
          </button>
          {(capture.audioUrl || capture.isStarting) && (
            <button
              className="secondary"
              disabled={capture.isProcessing}
              onClick={clear}
            >
              {capture.isStarting ? "Cancel" : "Clear recording"}
            </button>
          )}
          <span className="tabular-nums muted" aria-label="Recording duration">
            {capture.duration.toFixed(1)} / 15s
          </span>
        </div>
        <p role="status" className="text-sm mt-2">
          {capture.isRecording
            ? "Recording. Press Stop recording when finished."
            : capture.isProcessing
              ? "Preparing playback and acoustic observations…"
              : ""}
        </p>
        {capture.error && (
          <p role="alert" className="error-box mt-3">
            {capture.error}
          </p>
        )}
        {capture.audioUrl && (
          <div className="mt-4 space-y-2">
            <audio
              aria-label="Your recording"
              src={capture.audioUrl}
              controls
              className="w-full"
            />
            <a
              className="text-sm underline"
              href={capture.audioUrl}
              download={`lexio-${drill.id}.wav`}
            >
              Download this recording (.wav)
            </a>
            <p className="muted text-sm">
              Playback lasts until you leave this exercise. Download it if you
              want to keep the audio.
            </p>
          </div>
        )}
      </section>
      {observation && (
        <section aria-labelledby="reflect-title">
          <h3 id="reflect-title" className="step-title">
            3. Listen back and reflect
          </h3>
          <p
            role="status"
            className={
              observation.quality === "usable" ? "notice" : "error-box"
            }
          >
            {observation.message}
          </p>
          {observation.quality === "usable" && (
            <>
              <p className="muted text-sm my-3">
                Pronunciation, individual sounds, stress and intonation are not
                automatically graded. Your reflection is a learning note, not a
                proficiency score.
              </p>
              <p className="mb-3">
                Could you hear the contrast or emphasis described above? What
                would you change on the next take?
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="secondary"
                  disabled={!attemptId || busy}
                  aria-pressed={reflection === "comfortable"}
                  onClick={() => void reflect("comfortable")}
                >
                  I feel comfortable
                </button>
                <button
                  className="secondary"
                  disabled={!attemptId || busy}
                  aria-pressed={reflection === "again"}
                  onClick={() => void reflect("again")}
                >
                  Practise again later
                </button>
                <button className="secondary" disabled={busy} onClick={onNext}>
                  Next exercise
                </button>
              </div>
              {!attemptId && (
                <p className="muted text-sm mt-2">
                  This recording has not been saved to practice history. Check
                  the storage message above.
                </p>
              )}
              <details className="mt-5">
                <summary>Explore acoustic observations</summary>
                <p className="muted text-sm my-3">
                  Experimental estimates of pitch and vowel resonances from the
                  whole recording. These curves do not identify words or
                  phonemes and cannot establish correctness. Noise and
                  microphone differences affect them.
                </p>
                <p className="text-sm mb-3">
                  Captured duration: {observation.durationSeconds.toFixed(1)}{" "}
                  seconds.{" "}
                  {observation.pitchContour.length
                    ? `Estimated pitch range: ${Math.round(Math.min(...observation.pitchContour.map((p) => p.frequency)))}–${Math.round(Math.max(...observation.pitchContour.map((p) => p.frequency)))} Hz.`
                    : "No stable pitch was detected."}{" "}
                  {observation.formants.length} frames with plausible resonance
                  estimates.{" "}
                  {observation.formants.length > 0 &&
                    `Mean F1: ${Math.round(observation.formants.reduce((sum, f) => sum + f.f1, 0) / observation.formants.length)} Hz; mean F2: ${Math.round(observation.formants.reduce((sum, f) => sum + f.f2, 0) / observation.formants.length)} Hz.`}
                </p>
                <div className="grid lg:grid-cols-2 gap-4 min-w-0">
                  <div className="min-w-0 overflow-hidden">
                    <h4>Pitch over time</h4>
                    <PitchContour
                      points={observation.pitchContour}
                      duration={observation.durationSeconds}
                      width={400}
                      height={260}
                    />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <h4>Vowel resonance estimates</h4>
                    <VowelChart
                      points={observation.formants}
                      width={400}
                      height={260}
                    />
                  </div>
                </div>
              </details>
            </>
          )}
        </section>
      )}
    </article>
  );
}
