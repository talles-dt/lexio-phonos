import {
  addAttempt,
  emptySession,
  type Progress,
  type SessionProgress,
  type SessionReflection,
} from "./progress";
import { sessions, taskId, type TaskKind } from "./sessions";
export function changeSession(
  p: Progress,
  id: string,
  change: (s: SessionProgress) => SessionProgress,
): Progress {
  if (!sessions.some((s) => s.id === id))
    throw new Error("Sessão desconhecida.");
  return {
    ...p,
    lastSessionId: id,
    sessions: { ...p.sessions, [id]: change(p.sessions[id] ?? emptySession()) },
  };
}
export function saveSessionAttempt(
  p: Progress,
  sessionId: string,
  kind: TaskKind,
  id: string,
  durationSeconds: number,
  createdAt: string,
): Progress {
  const next = addAttempt(p, {
    id,
    drillId: taskId(sessionId, kind),
    durationSeconds,
    createdAt,
    reflection: "unreviewed",
  });
  return changeSession(next, sessionId, (state) => ({
    ...state,
    [kind === "words" ? "wordsAttemptId" : "phraseAttemptId"]: id,
    completedAt: null,
    reflection: "unreviewed",
    step: kind === "words" ? 3 : 4,
  }));
}
export function finishSession(
  p: Progress,
  id: string,
  reflection: Exclude<SessionReflection, "unreviewed">,
  now: string,
): Progress {
  return changeSession(p, id, (s) => {
    const words = p.attempts.some(
      (a) => a.id === s.wordsAttemptId && a.drillId === taskId(id, "words"),
    );
    const phrase = p.attempts.some(
      (a) => a.id === s.phraseAttemptId && a.drillId === taskId(id, "phrase"),
    );
    if (!words || !phrase)
      throw new Error("Grave as palavras e a frase antes de concluir.");
    return { ...s, reflection, completedAt: now, step: 6 };
  });
}
