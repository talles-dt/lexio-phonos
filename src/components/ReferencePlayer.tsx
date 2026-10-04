"use client";
import { useEffect, useState } from "react";
export default function ReferencePlayer({
  text,
  disabled,
}: {
  text: string;
  disabled: boolean;
}) {
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
          .filter((v) => v.localService && /^en[-_]/i.test(v.lang)),
      );
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", update);
      speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    if (disabled && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      Promise.resolve().then(() => setPlaying(false));
    }
  }, [disabled]);
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
          "The browser voice could not play. Try another voice, or practise without it.",
        );
    };
    setPlaying(true);
    speechSynthesis.speak(utterance);
  }
  return (
    <div className="space-y-3">
      <p className="muted text-sm">
        Optional browser voice · synthetic model, not a teacher recording.
        Accent and quality depend on your device. Only on-device English voices
        are used.
      </p>
      {voices.length ? (
        <div className="flex flex-wrap gap-3 items-end">
          <label className="field">
            Voice
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
            Speed
            <select
              value={rate}
              disabled={disabled || playing}
              onChange={(e) => setRate(Number(e.target.value))}
            >
              <option value={0.7}>Slow</option>
              <option value={0.85}>Steady</option>
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
            {playing ? "Stop model" : "Listen to model"}
          </button>
        </div>
      ) : (
        <p className="muted text-sm">
          No on-device English voice available. You can still record and listen
          to yourself. Install an English voice in your device speech settings
          to enable the model.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
