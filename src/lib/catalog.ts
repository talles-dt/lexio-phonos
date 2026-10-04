import catalog from "@/data/catalog.json";
import type { Drill } from "@/types/pronunciation";

export const drills = catalog.drills as Drill[];
export const phonemes = catalog.phonemes;
export const categoryLabels: Record<string, string> = {
  MINIMAL_PAIR: "Minimal pairs",
  VOWEL_REDUCTION: "Vowel reduction",
  INTONATION: "Intonation",
  CONSONANT_CLUSTER: "Consonant clusters",
  WORD_STRESS: "Word stress",
  LEXICAL_STRESS: "Word stress",
  CONNECTED_SPEECH: "Connected speech",
  STRESS_TIMING: "Stress and rhythm",
};
