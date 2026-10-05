import data from "@/data/sessions.json";
import type { Drill } from "@/types/pronunciation";
export const sessions = data.sessions;
export type GuidedSession = (typeof sessions)[number];
export const sessionSources: Record<string, string> = data.sources;
export const families = [...new Set(sessions.map((s) => s.family))];
export type TaskKind = "words" | "phrase";
export const taskId = (id: string, kind: TaskKind) => `${id}-${kind}`;
export function sessionDrill(session: GuidedSession, kind: TaskKind): Drill {
  return {
    id: taskId(session.id, kind),
    title: `${session.title} · ${kind === "words" ? "Palavras" : "Frase"}`,
    drillType: "CONNECTED_SPEECH",
    difficulty: 1,
    targetText:
      kind === "words"
        ? session.words.map((w) => w.text).join(", ")
        : session.phrase.text,
    targetIpa:
      kind === "words"
        ? session.words.map((w) => w.ipa).join(" | ")
        : session.phrase.ipa,
    description: session.objective,
    accentNote: "Inglês americano geral",
    phonemeSequence: [],
  };
}
export const guidedDrills = sessions.flatMap((s) => [
  sessionDrill(s, "words"),
  sessionDrill(s, "phrase"),
]);
