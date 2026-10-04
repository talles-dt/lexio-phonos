// Drill categories
export type DrillCategory =
  | "WORD_STRESS"
  | "MINIMAL_PAIR"
  | "VOWEL_REDUCTION"
  | "LEXICAL_STRESS"
  | "CONSONANT_CLUSTER"
  | "CONNECTED_SPEECH"
  | "INTONATION"
  | "STRESS_TIMING";

// Phoneme with sequence data for drills
export interface DrillPhoneme {
  phonemeId: string;
  position: number;
  startTimeMs: number | null;
  endTimeMs: number | null;
  phoneme?: {
    f1TargetHz: number | null;
    f2TargetHz: number | null;
  };
}

// Drills data structure for the frontend
export interface Drill {
  id: string;
  title: string;
  drillType: DrillCategory;
  targetText: string;
  targetIpa: string;
  accentNote?: string;
  referenceSourceUrl?: string;
  description: string | null;
  difficulty: number;
  phonemeSequence: DrillPhoneme[];
}

// Visualization data points
export interface FormantPoint {
  f1: number;
  f2: number;
  timestamp: number;
  phonemeId?: string | null;
  isTarget?: boolean;
  confidence?: number;
}

export interface PitchPoint {
  frequency: number;
  timestamp: number;
  isTarget?: boolean;
  confidence?: number;
}

// Vowel chart configuration
export interface VowelCategoryConfig {
  label: string;
  color: string;
  f1Range: [number, number];
  f2Range: [number, number];
}

export interface VowelChartConfig {
  f1Range: [number, number];
  f2Range: [number, number];
  vowelCategories: Record<string, VowelCategoryConfig>;
}
