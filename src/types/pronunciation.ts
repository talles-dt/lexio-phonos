// Mastery levels
export type MasteryLevel = 'NOVICE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';

export interface MasteryThresholds {
  NOVICE: { min: number; max: number; };
  BEGINNER: { min: number; max: number; };
  INTERMEDIATE: { min: number; max: number; };
  ADVANCED: { min: number; max: number; };
  MASTER: { min: number; max: number; };
}

// Drill categories
export type DrillCategory = 'MINIMAL_PAIR' | 'VOWEL_REDUCTION' | 'LEXICAL_STRESS' | 'CONSONANT_CLUSTER' | 'CONNECTED_SPEECH' | 'INTONATION' | 'STRESS_TIMING';

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
  description: string | null;
  difficulty: number;
  phonemeSequence: DrillPhoneme[];
}

// Pronunciation scoring results
export interface PronunciationScore {
  overall: number;
  pitchAccuracy: number;
  timing: number;
  formantAccuracy: number;
  phonemeBreakdown: PhonemeScore[];
  suggestions: string[];
}

// Pronunciation scoring results
export interface PronunciationScore {
  overall: number;
  pitchAccuracy: number;
  timing: number;
  formantAccuracy: number;
  stressTimingAccuracy?: number;
  phonemeBreakdown: PhonemeScore[];
  stressTiming?: StressTimingScore[];
  suggestions: string[];
}

// GOP (Goodness of Pronunciation) score for a single phoneme
export interface GOPScore {
  phonemeId: string;
  position: number;
  startTimeMs: number;
  endTimeMs: number;
  gopScore: number;
  detectedF1: number | null;
  detectedF2: number | null;
  targetF1: number | null;
  targetF2: number | null;
  isAcceptable: boolean;
  confidence: number;
}

// Stress timing score for a phoneme/syllable
export interface StressTimingScore {
  phonemeId: string;
  position: number;
  startTimeMs: number;
  endTimeMs: number;
  targetDurationMs: number;
  detectedDurationMs: number;
  durationRatio: number;
  isPrimaryStress: boolean;
  isSecondaryStress: boolean;
  score: number;
}

export interface PhonemeScore {
  phonemeId: string;
  positionIndex: number;
  startTimeMs: number;
  endTimeMs: number;
  gopScore: number;
  targetF1?: number | null;
  targetF2?: number | null;
  detectedF1?: number | null;
  detectedF2?: number | null;
  isAcceptable: boolean;
  confidence?: number | null;
}

export interface DrillAnalysis {
  drillId: string;
  targetText: string;
  targetIpa: string;
  phonemeSequence: PhonemeTarget[];
  userRecording: UserRecording;
  scores: PronunciationScore;
}

export interface UserRecording {
  blob: Blob | null;
  url: string | null;
  durationMs: number;
  sampleRate: number;
  samples: Float32Array;
}

export interface ScoringConfig {
  gopWeight: number;
  pitchWeight: number;
  timingWeight: number;
  formantWeight: number;
  acceptableThreshold: number;
}

// Formant target for each phoneme in a drill
export interface PhonemeTarget {
  phonemeId: string;
  position: number;
  startTimeMs: number;
  endTimeMs: number;
  f1Target: number | null;
  f2Target: number | null;
}

// User phoneme mastery tracking
export interface UserPhonemeMastery {
  phonemeId: string;
  attemptsCount: number;
  averageGopScore: number;
  masteryLevel: MasteryLevel;
  lastPracticedAt: Date;
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

// Utility functions for score visualization
export function getScoreColor(score: number): string {
  if (score >= 80) return 'lexio-phosphor';
  if (score >= 60) return 'lexio-amber';
  if (score >= 40) return 'lexio-violet';
  return 'lexio-crimson';
}

export function getMasteryLevel(score: number): MasteryLevel {
  if (score >= 0.9) return 'MASTER';
  if (score >= 0.7) return 'ADVANCED';
  if (score >= 0.5) return 'INTERMEDIATE';
  if (score >= 0.3) return 'BEGINNER';
  return 'NOVICE';
}

export const MASTERY_THRESHOLDS: Record<MasteryLevel, { min: number; max: number }> = {
  NOVICE: { min: 0, max: 0.3 },
  BEGINNER: { min: 0.3, max: 0.5 },
  INTERMEDIATE: { min: 0.5, max: 0.7 },
  ADVANCED: { min: 0.7, max: 0.9 },
  MASTER: { min: 0.9, max: 1 },
};
