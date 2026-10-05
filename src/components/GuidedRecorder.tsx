"use client";
import { useEffect, useState } from "react";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { analyzeInWorker } from "@/utils/analyzeInWorker";
import type { AudioObservation } from "@/utils/scoring";
const qualityMessages: Record<AudioObservation["quality"], string> = {
  usable:
    "Som capturado. Ouça sua gravação. Isso não confirma que as palavras ou os sons-alvo foram identificados.",
  silent:
    "Quase nenhum som foi capturado. Confira o microfone, aproxime-se e tente novamente.",
  too_short:
    "A gravação ficou muito curta. Diga toda a sequência, com pequenas pausas, e então pare.",
  clipped:
    "O áudio pode estar distorcido. Afaste-se do microfone ou reduza o volume de entrada e tente novamente.",
  invalid: "Não foi possível ler o áudio. Grave novamente.",
};
export default function GuidedRecorder({
  taskId,
  onSave,
  onBusy,
}: {
  taskId: string;
  onSave: (seconds: number) => Promise<boolean>;
  onBusy: (busy: boolean) => void;
}) {
  const [quality, setQuality] = useState<AudioObservation["quality"] | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const capture = useAudioCapture({
    locale: "pt-BR",
    onRecordingStart: () => {
      setQuality(null);
      setSaved(false);
    },
    onRecordingStop: async ({ samples, sampleRate }) => {
      const observation = await analyzeInWorker(samples, sampleRate);
      setQuality(observation.quality);
      if (observation.quality === "usable")
        setSaved(await onSave(observation.durationSeconds));
    },
  });
  const busy =
    capture.isStarting || capture.isRecording || capture.isProcessing;
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);
  async function record() {
    if (capture.isRecording) return capture.stopRecording();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    document.querySelectorAll("audio").forEach((audio) => audio.pause());
    setQuality(null);
    setSaved(false);
    await capture.startRecording();
  }
  return (
    <section aria-label="Gravação da tarefa" className="space-y-3">
      <p className="muted">
        Diga o texto completo e pare. Limite: 15 segundos. Sua voz não é enviada
        a servidores.
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          className={capture.isRecording ? "danger" : "primary"}
          disabled={capture.isStarting || capture.isProcessing}
          onClick={() => void record()}
        >
          {capture.isStarting
            ? "Aguardando microfone…"
            : capture.isProcessing
              ? "Preparando áudio…"
              : capture.isRecording
                ? "Parar gravação"
                : "Gravar agora"}
        </button>
        {(capture.isStarting || capture.audioUrl) && (
          <button
            className="secondary"
            disabled={capture.isProcessing}
            onClick={() => {
              capture.clearRecording();
              setQuality(null);
              setSaved(false);
            }}
          >
            {capture.isStarting ? "Cancelar permissão" : "Limpar áudio atual"}
          </button>
        )}
        <span className="muted tabular-nums" aria-label="Duração da gravação">
          {capture.duration.toFixed(1)} / 15s
        </span>
      </div>
      <p role="status">
        {capture.isRecording
          ? "Gravando. Pare quando terminar."
          : capture.isProcessing
            ? "Preparando reprodução…"
            : quality
              ? qualityMessages[quality]
              : ""}
      </p>
      {capture.error && (
        <p role="alert" className="error-box">
          {capture.error}
        </p>
      )}
      {capture.audioUrl && (
        <>
          <audio
            aria-label="Sua gravação"
            src={capture.audioUrl}
            controls
            className="w-full"
          />
          <a
            href={capture.audioUrl}
            download={`lexio-${taskId}.wav`}
            className="underline"
          >
            Baixar áudio WAV
          </a>
          <p className="muted text-sm">
            O áudio atual fica disponível até você sair desta tarefa. Baixe-o
            para guardar. Limpar o áudio não apaga a anotação no diário.
          </p>
        </>
      )}
      {saved && (
        <p className="notice" role="status">
          Prática salva neste dispositivo.
        </p>
      )}
      {quality === "usable" && !saved && !busy && (
        <p className="error-box">
          O áudio está disponível, mas a prática não foi salva. Verifique o
          aviso de armazenamento. Você pode baixar a gravação.
        </p>
      )}
    </section>
  );
}
