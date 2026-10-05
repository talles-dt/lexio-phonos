"use client";
import { useEffect, useState } from "react";
export default function ReferencePlayer({
  text,
  disabled,
  locale = "en",
  requiredAccent,
}: {
  locale?: "en" | "pt-BR";
  requiredAccent?: "en-US";
  text: string;
  disabled: boolean;
}) {
  const pt = locale === "pt-BR";
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(0.85);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () =>
      setVoices(
        speechSynthesis
          .getVoices()
          .filter(
            (v) =>
              v.localService &&
              (requiredAccent
                ? v.lang.replace("_", "-").toLowerCase() ===
                  requiredAccent.toLowerCase()
                : /^en[-_]/i.test(v.lang)),
          ),
      );
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", update);
      speechSynthesis.cancel();
    };
  }, [requiredAccent]);
  useEffect(() => {
    if (disabled && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      Promise.resolve().then(() => setPlaying(false));
    }
  }, [disabled]);
  useEffect(() => {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    Promise.resolve().then(() => setPlaying(false));
  }, [text]);
  const voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0];
  function play() {
    if (!voice) return;
    speechSynthesis.cancel();
    setError("");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = (event) => {
      setPlaying(false);
      if (!["interrupted", "canceled"].includes(event.error))
        setError(
          pt
            ? "A voz do navegador não pôde tocar. Tente outra voz americana local ou pratique sem modelo."
            : "The browser voice could not play. Try another voice, or practise without it.",
        );
    };
    setPlaying(true);
    speechSynthesis.speak(utterance);
  }
  return (
    <div className="space-y-3">
      <p className="muted text-sm">
        {pt
          ? "Modelo sintético provisório · voz americana do dispositivo, não gravação de professor. A qualidade depende do aparelho; não é um teste auditivo pontuado."
          : "Optional browser voice · synthetic model, not a teacher recording. Accent and quality depend on your device. Only on-device English voices are used."}
      </p>
      {voices.length ? (
        <div className="flex flex-wrap gap-3 items-end">
          <label className="field">
            {pt ? "Voz" : "Voice"}
            <select
              value={voice?.voiceURI ?? ""}
              disabled={disabled || playing}
              onChange={(e) => setVoiceURI(e.target.value)}
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {pt ? "Velocidade" : "Speed"}
            <select
              value={rate}
              disabled={disabled || playing}
              onChange={(e) => setRate(Number(e.target.value))}
            >
              <option value={0.7}>{pt ? "Lenta" : "Slow"}</option>
              <option value={0.85}>{pt ? "Moderada" : "Steady"}</option>
              <option value={1}>Normal</option>
            </select>
          </label>
          <button
            className="secondary"
            disabled={disabled}
            onClick={() => {
              if (playing) {
                speechSynthesis.cancel();
                setPlaying(false);
              } else play();
            }}
          >
            {playing
              ? pt
                ? "Parar modelo"
                : "Stop model"
              : pt
                ? "Ouvir modelo"
                : "Listen to model"}
          </button>
        </div>
      ) : (
        <p className="muted text-sm">
          {pt
            ? "Nenhuma voz americana local disponível. Você pode continuar sem modelo e ouvir sua própria gravação. Para ativar o modelo, instale uma voz de inglês dos EUA nas configurações do dispositivo. Não usamos outra variedade ou voz remota automaticamente."
            : "No on-device English voice available. You can still record and listen to yourself. Install an English voice in your device speech settings to enable the model."}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
