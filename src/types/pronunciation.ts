// Pronunciation scoring and analysis types

export interface Phoneme {
  id: string;
  ipaSymbol: string;
  category: string;
  f1TargetHz: number | null;
  f2TargetHz: number | null;
  description: string | null;
}

export interface Drill {
  id: string;
  title: string;
  drillType: string;
  targetText: string;
  targetIpa: string;
  description: string | null;
  difficulty: number;
  referenceAudioUrl: string | null;
  referenceF0Contour: string | null;
  createdAt: Date;
  updatedAt: Date;
  phonemeSequence: DrillPhoneme[];
}

export interface DrillPhoneme {
  id: string;
  drillId: string;
  phonemeId: string;
  position: number;
  startTimeMs: number | null;
  endTimeMs: number | null;
  phoneme: Phoneme;
}

export interface UserRecording {
  id: string;
  userId: string | null;
  drillId: string;
  audioBlobUrl: string;
  durationMs: number;
  overallScore: number;
  pitchAccuracyScore: number | null;
  timingScore: number | null;
  formantScore: number | null;
  createdAt: Date;
  drill: Drill;
  phonemeScores: PhonemeScore[];
}

export interface PhonemeScore {
  id: string;
  recordingId: string;
  phonemeId: string;
  positionIndex: number;
  startTimeMs: number;
  endTimeMs: number;
  gopScore: number;
  detectedF1: number | null;
  detectedF2: number | null;
  isAcceptable: boolean;
  confidence: number | null;
  createdAt: Date;
  phoneme: Phoneme;
}

export interface UserPhonemeMastery {
  userId: string;
  phonemeId: string;
  attemptsCount: number;
  averageGopScore: number;
  masteryLevel: number;
  lastPracticedAt: Date;
  phoneme: Phoneme;
}

// Scoring types
export interface GOPScore {
  phonemeId: string;
  position: number;
  startTimeMs: number;
  endTimeMs: number;
  gopScore: number; // 0-1
  detectedF1: number | null;
  detectedF2: number | null;
  targetF1: number | null;
  targetF2: number | null;
  isAcceptable: boolean;
  confidence: number;
}

export interface PronunciationScore {
  overall: number; // 0-100
  pitchAccuracy: number; // 0-100
  timing: number; // 0-100
  formantAccuracy: number; // 0-100
  phonemeBreakdown: GOPScore[];
  suggestions: string[];
}

export interface ScoringConfig {
  gopWeight: number; // 0-1
  pitchWeight: number; // 0-1
  timingWeight: number; // 0-1
  formantWeight: number; // 0-1
  acceptableThreshold: number; // 0-1
}

// Target phoneme sequences
export interface PhonemeTarget {
  phonemeId: string;
  startTimeMs: number;
  endTimeMs: number;
  f1Target: number | null;
  f2Target: number | null;
}

export interface DrillAnalysis {
  drillId: string;
  targetText: string;
  targetIpa: string;
  phonemeSequence: PhonemeTarget[];
  userRecording: AudioData;
  scores: PronunciationScore;
}

export interface AudioData {
  blob: Blob | null;
  url: string | null;
  durationMs: number;
  sampleRate: number;
  samples: Float32Array | null;
}

// Visualization types
export interface FormantPoint {
  f1: number;
  f2: number;
  timestamp: number;
  phonemeId: string | null;
  isTarget: boolean;
  confidence: number;
}

export interface PitchPoint {
  frequency: number;
  timestamp: number;
  isTarget: boolean;
  confidence: number;
}

export interface VowelChartConfig {
  f1Range: [number, number]; // [min, max] in Hz
  f2Range: [number, number]; // [min, max] in Hz
  vowelCategories: {
    [category: string]: {
      label: string;
      color: string;
      f1Range: [number, number];
      f2Range: [number, number];
    };
  };
}

// Drill categories
export type DrillCategory = 
  | 'MINIMAL_PAIR'
  | 'VOWEL_REDUCTION'
  | 'INTONATION'
  | 'CONSONANT_CLUSTER'
  | 'WORD_STRESS';

export const DRILL_CATEGORIES: DrillCategory[] = [
  'MINIMAL_PAIR',
  'VOWEL_REDUCTION',
  'INTONATION',
  'CONSONANT_CLUSTER',
  'WORD_STRESS',
];

// Mastery levels
export type MasteryLevel = 'NOVICE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';

export interface MasteryThresholds {
  NOVICE: { min: number; max: number; };
  BEGINNER: { min: number; max: number; };
  INTERMEDIATE: { min: number; max: number; };
  ADVANCED: { min: number; max: number; };
  MASTER: { min: number; max: number; };
}

export const MASTERY_THRESHOLDS: MasteryThresholds = {
  NOVICE: { min: 0, max: 0.2 },
  BEGINNER: { min: 0.2, max: 0.4 },
  INTERMEDIATE: { min: 0.4, max: 0.7 },
  ADVANCED: { min: 0.7, max: 0.9 },
  MASTER: { min: 0.9, max: 1.0 },
};

// Color coding for scores
export const SCORE_COLORS = {
  EXCELLENT: { color: 'bg-green-500', text: 'Excellent (85%+)' },
  GOOD: { color: 'bg-yellow-500', text: 'Good (60-84%)' },
  NEEDS_IMPROVEMENT: { color: 'bg-orange-500', text: 'Needs Improvement (40-59%)' },
  POOR: { color: 'bg-red-500', text: 'Poor (<40%)' },
};

export function getScoreColor(score: number): string {
  if (score >= 85) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getMasteryLevel(score: number): MasteryLevel {
  if (score >= 0.9) return 'MASTER';
  if (score >= 0.7) return 'ADVANCED';
  if (score >= 0.4) return 'INTERMEDIATE';
  if (score >= 0.2) return 'BEGINNER';
  return 'NOVICE';
}
