"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptySession,
  type Progress,
  type SessionReflection,
} from "@/lib/progress";
import {
  changeSession,
  finishSession,
  saveSessionAttempt,
} from "@/lib/sessionProgress";
import {
  families,
  sessions,
  sessionSources,
  taskId,
  type GuidedSession,
  type TaskKind,
} from "@/lib/sessions";
import GuidedRecorder from "./GuidedRecorder";
import ReferencePlayer from "./ReferencePlayer";
type Change = (fn: (p: Progress) => Progress) => Promise<boolean>;
const steps = [
  "Objetivo",
  "Ouvir e observar",
  "Preparar o gesto",
  "Gravar palavras",
  "Aplicar em frase",
  "Refletir",
  "Prática concluída",
];
const reflectionLabels: Record<SessionReflection, string> = {
  unreviewed: "Sem reflexão",
  comfortable: "Ficou confortável",
  again: "Quero repetir",
  uncertain: "Ainda não consigo perceber a diferença",
};
function Runner({
  session,
  progress,
  change,
  onBusy,
  onExit,
  onNext,
}: {
  session: GuidedSession;
  progress: Progress;
  change: Change;
  onBusy: (v: boolean) => void;
  onExit: () => void;
  onNext: () => void;
}) {
  const state = progress.sessions[session.id] ?? emptySession();
  const [step, setStep] = useState(state.step);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelText, setModelText] = useState(session.words[0].text);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const locked = busy || saving;
  const recordingBusy = useCallback(
    (value: boolean) => {
      setBusy(value);
      onBusy(value);
    },
    [onBusy],
  );
  async function move(next: number) {
    setSaving(true);
    await change((p) =>
      changeSession(p, session.id, (s) => ({ ...s, step: next })),
    );
    setStep(next);
    setSaving(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function save(kind: TaskKind, duration: number) {
    return change((p) =>
      saveSessionAttempt(
        p,
        session.id,
        kind,
        crypto.randomUUID(),
        duration,
        new Date().toISOString(),
      ),
    );
  }
  async function finish(value: Exclude<SessionReflection, "unreviewed">) {
    setSaving(true);
    if (
      await change((p) =>
        finishSession(p, session.id, value, new Date().toISOString()),
      )
    ) {
      setStep(6);
      requestAnimationFrame(() => heading.current?.focus());
    }
    setSaving(false);
  }
  const current = step === 6 && !state.completedAt ? 5 : step;
  const kind: TaskKind = current === 4 ? "phrase" : "words";
  const canAdvance =
    current === 3
      ? !!state.wordsAttemptId
      : current === 4
        ? !!state.phraseAttemptId
        : true;
  return (
    <article
      className="panel space-y-5"
      aria-label="Sessão guiada em andamento"
    >
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <p className="eyebrow">
          {session.family} · {session.order}/20 · 3–5 min
        </p>
        <button className="secondary" disabled={locked} onClick={onExit}>
          Voltar às sessões
        </button>
      </div>
      <h2 className="text-2xl font-bold">{session.title}</h2>
      <p className="muted text-sm">
        Inglês americano geral · A2–B1 com apoio em português. Seu progresso
        mede prática, não domínio dos sons.
      </p>
      <p role="status">
        {current < 6 ? `Etapa ${current + 1} de 6` : "Prática registrada"} ·{" "}
        {steps[current]}
      </p>
      <progress
        className="w-full"
        aria-label="Etapas da sessão"
        max={6}
        value={current}
      />
      <h3 ref={heading} tabIndex={-1} className="step-title">
        {steps[current]}
      </h3>
      {current === 0 && (
        <>
          <p>{session.objective}</p>
          <p className="notice">
            Ao ouvir, observe: {session.reflectionPrompt}
          </p>
          <p>
            Você poderá repetir ou continuar no seu ritmo. IPA e traduções são
            opcionais.
          </p>
        </>
      )}
      {current === 1 && (
        <>
          <p>
            Escolha uma palavra, a sequência ou a frase para ouvir. Observe o
            final; não é um teste com nota.
          </p>
          <label className="field">
            Texto do modelo
            <select
              value={modelText}
              onChange={(e) => setModelText(e.target.value)}
            >
              {session.words.map((w) => (
                <option key={w.text} value={w.text}>
                  {w.text}
                </option>
              ))}
              <option value={session.words.map((w) => w.text).join(", ")}>
                Sequência completa
              </option>
              <option value={session.phrase.text}>Frase de aplicação</option>
            </select>
          </label>
          <ReferencePlayer
            text={modelText}
            disabled={locked}
            locale="pt-BR"
            requiredAccent="en-US"
          />
          <p className="muted">
            Pode continuar sem áudio-modelo. A voz sintética pode não realizar o
            contraste como um professor o demonstraria.
          </p>
        </>
      )}
      {current === 2 && (
        <>
          <p>{session.gesture}</p>
          <p className="notice">{session.note}</p>
          <p>
            Experimente uma vez sem gravar. Concentre-se em um gesto; não é
            preciso falar mais forte.
          </p>
        </>
      )}
      {(current === 0 || current === 1 || current === 2 || current === 3) && (
        <ul className="grid sm:grid-cols-2 gap-3">
          {session.words.map((w) => (
            <li key={w.text} className="target-box min-w-0">
              <p lang="en-US" className="text-2xl">
                {w.text}
              </p>
              <details>
                <summary>
                  Significado e IPA de <span lang="en-US">{w.text}</span>
                </summary>
                <p>{w.meaning}</p>
                <p lang="en-fonipa">/{w.ipa}/</p>
              </details>
            </li>
          ))}
        </ul>
      )}
      {(current === 3 || current === 4) && (
        <>
          <div className="target-box">
            <p className="eyebrow">
              {current === 3
                ? "Diga a sequência com pequenas pausas"
                : "Diga a frase completa"}
            </p>
            <p lang="en-US" className="text-2xl my-3">
              {current === 3
                ? session.words.map((w) => w.text).join(", ")
                : session.phrase.text}
            </p>
            {current === 4 && (
              <details>
                <summary>Significado e IPA da frase</summary>
                <p>{session.phrase.meaning}</p>
                <p lang="en-fonipa">/{session.phrase.ipa}/</p>
              </details>
            )}
          </div>
          <ReferencePlayer
            text={
              current === 3
                ? session.words.map((w) => w.text).join(", ")
                : session.phrase.text
            }
            disabled={locked}
            locale="pt-BR"
            requiredAccent="en-US"
          />
          <GuidedRecorder
            key={kind}
            taskId={taskId(session.id, kind)}
            onSave={(duration) => save(kind, duration)}
            onBusy={recordingBusy}
          />
          {canAdvance && (
            <p className="notice">
              Já existe uma tentativa salva para esta tarefa. Você pode avançar
              ou gravar novamente. O áudio de uma visita anterior não fica
              guardado no diário.
            </p>
          )}
        </>
      )}
      {current === 5 && (
        <>
          <p>{session.reflectionPrompt}</p>
          <p className="muted">
            O aplicativo não verifica acerto fonêmico, epêntese ou vozeamento.
            Escolha sua percepção da prática.
          </p>
          {(!state.wordsAttemptId || !state.phraseAttemptId) && (
            <p className="error-box">
              Falta uma tarefa salva. Volte e grave as palavras e a frase para
              concluir.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {(["comfortable", "again", "uncertain"] as const).map((value) => (
              <button
                className="secondary"
                key={value}
                disabled={
                  locked || !state.wordsAttemptId || !state.phraseAttemptId
                }
                onClick={() => void finish(value)}
              >
                {reflectionLabels[value]}
              </button>
            ))}
          </div>
        </>
      )}
      {current === 6 && (
        <>
          <p className="notice">
            Sessão concluída: duas tarefas gravadas e uma reflexão registrada.
            Isso não comprova domínio dos sons.
          </p>
          <p>Sua reflexão: {reflectionLabels[state.reflection]}</p>
          <div className="flex flex-wrap gap-3">
            <button className="primary" onClick={onNext}>
              Próxima sessão sugerida
            </button>
            <button
              className="secondary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                if (
                  await change((p) =>
                    changeSession(p, session.id, () => emptySession()),
                  )
                )
                  setStep(0);
                setSaving(false);
              }}
            >
              Repetir sessão
            </button>
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-3">
        {current > 0 && current < 6 && (
          <button
            className="secondary"
            disabled={locked}
            onClick={() => void move(current - 1)}
          >
            Etapa anterior
          </button>
        )}
        {current < 5 && (
          <button
            className="primary"
            disabled={locked || !canAdvance}
            onClick={() => void move(current + 1)}
          >
            {current === 1 ? "Continuar para o gesto" : "Continuar"}
          </button>
        )}
      </div>
      <details className="text-sm muted">
        <summary>Como ler o IPA?</summary>
        <p>
          Os símbolos entre barras representam sons. ˈ marca a sílaba tônica.
          Usamos /i/ e /u/ na transcrição americana; diferem em qualidade de /ɪ/
          e /ʊ/, não apenas em duração. O símbolo /r/ representa o r americano
          nesta referência. Você pode praticar sem memorizar o alfabeto.
        </p>
      </details>
      <details className="text-sm muted">
        <summary>Sobre esta sessão e suas fontes</summary>
        <p>
          Seleção pedagógica, não diagnóstico individual nem ranking universal.
          A referência americana não invalida outros sotaques.
        </p>
        <p>{session.note}</p>
        <ul>
          {session.sources.map((id) => (
            <li key={id}>
              <a
                href={sessionSources[id]}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pesquisa: {id} (abre em outra aba)
              </a>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
export default function GuidedSessions({
  progress,
  change,
  onBusy,
  initialSessionId,
}: {
  progress: Progress;
  change: Change;
  onBusy: (v: boolean) => void;
  initialSessionId?: string | null;
}) {
  const [activeId, setActiveId] = useState<string | null>(
    initialSessionId ?? progress.lastSessionId,
  );
  const listHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!activeId) listHeading.current?.focus();
  }, [activeId]);
  const active = sessions.find((s) => s.id === activeId);
  function open(id: string) {
    setActiveId(id);
    void change((p) => ({ ...p, lastSessionId: id }));
  }
  return (
    <section lang="pt-BR" aria-label="Sessões guiadas" className="space-y-5">
      {active ? (
        <Runner
          key={active.id}
          session={active}
          progress={progress}
          change={change}
          onBusy={onBusy}
          onExit={() => {
            setActiveId(null);
            onBusy(false);
          }}
          onNext={() =>
            open(sessions[(sessions.indexOf(active) + 1) % sessions.length].id)
          }
        />
      ) : (
        <>
          <h2 ref={listHeading} tabIndex={-1} className="text-2xl font-bold">
            20 sessões para terminar as palavras com clareza
          </h2>
          <p>
            Escolha uma família de sons. A ordem é uma sugestão; todas as
            sessões estão disponíveis. Dezesseis focam finais de palavras.
          </p>
          <p className="muted">
            Inglês americano geral · A2–B1 · 3–5 minutos por sessão · modelo
            sintético provisório. Não há notas de pronúncia.
          </p>
          {families.map((family) => (
            <section className="panel space-y-3" key={family}>
              <h3 className="step-title">{family}</h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {sessions
                  .filter((s) => s.family === family)
                  .map((s) => {
                    const state = progress.sessions[s.id];
                    return (
                      <li key={s.id}>
                        <button
                          className="exercise-row guided-row text-left w-full"
                          onClick={() => open(s.id)}
                        >
                          <strong>
                            {s.order}. {s.title}
                          </strong>
                          <span className="block muted text-sm">
                            {state?.completedAt
                              ? "Prática concluída"
                              : state
                                ? "Retomar"
                                : "Começar"}{" "}
                            · {s.words.map((w) => w.text).join(" / ")}
                          </span>
                          {state &&
                            ["again", "uncertain"].includes(
                              state.reflection,
                            ) && (
                              <span className="block text-sm">
                                Sua escolha:{" "}
                                {reflectionLabels[state.reflection]}
                              </span>
                            )}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  );
}
