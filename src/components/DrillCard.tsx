"use client";

// Drill card component for pronunciation practice

import React, { useState, useCallback } from 'react';
import { Drill, DrillPhoneme, getScoreColor } from '@/types/pronunciation';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { VowelChart } from './VowelChart';
import { PitchContour } from './PitchContour';
import { FormantPoint, PitchPoint } from '@/types/pronunciation';
import { analyzeDrill, extractFormantsFromAudio, extractPitchContour } from '@/utils/scoring';
import { DrillAnalysis, type PhonemeTarget } from '@/types/pronunciation';

interface DrillCardProps {
  drill: Drill & { phonemeSequence: DrillPhoneme[] };
  onComplete?: (score: number, analysis: DrillAnalysis) => void;
  showVisualization?: boolean;
}

export const DrillCard: React.FC<DrillCardProps> = ({
  drill,
  onComplete,
  showVisualization = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState<DrillAnalysis | null>(null);
  const [formantPoints, setFormantPoints] = useState<FormantPoint[]>([]);
  const [pitchPoints, setPitchPoints] = useState<PitchPoint[]>([]);
  const [targetFormantPoints, setTargetFormantPoints] = useState<FormantPoint[]>([]);
  const [targetPitchPoints, setTargetPitchPoints] = useState<PitchPoint[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Audio capture hook
  const {
    isRecording: capturing,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioCapture({
    targetSampleRate: 16000,
    onRecordingStart: () => {
      setIsRecording(true);
      setAnalysis(null);
      setScore(null);
      setSuggestions([]);
    },
    onRecordingStop: async (audioData) => {
      setIsRecording(false);

      // Convert DrillPhoneme[] to PhonemeTarget[]
      const phonemeTargets: PhonemeTarget[] = drill.phonemeSequence.map((p) => ({
        phonemeId: p.phonemeId,
        position: p.position,
        startTimeMs: p.startTimeMs ?? 0,
        endTimeMs: p.endTimeMs ?? 0,
        f1Target: p.phoneme?.f1TargetHz ?? null,
        f2Target: p.phoneme?.f2TargetHz ?? null,
      }));

      const result = analyzeDrill(
        drill.id,
        drill.targetText,
        drill.targetIpa,
        phonemeTargets,
        audioData.samples,
        audioData.sampleRate
      );

      setAnalysis(result);
      setScore(result.scores.overall);
      setSuggestions(result.scores.suggestions);

      // Extract visualization data
      const formants = extractFormantsFromAudio(audioData.samples, audioData.sampleRate);
      const formantPoints: FormantPoint[] = formants.map((f) => ({
        f1: f.f1,
        f2: f.f2,
        timestamp: f.timestamp,
        phonemeId: null,
        isTarget: false,
        confidence: f.confidence,
      }));
      setFormantPoints(formantPoints);

      const pitches = extractPitchContour(audioData.samples, audioData.sampleRate);
      const pitchPoints: PitchPoint[] = pitches.map((p) => ({
        frequency: p.frequency,
        timestamp: p.timestamp,
        isTarget: false,
        confidence: p.confidence,
      }));
      setPitchPoints(pitchPoints);

      // Set target points from phoneme sequence
      const targetFormants: FormantPoint[] = drill.phonemeSequence
        .filter((p) => p.phoneme?.f1TargetHz && p.phoneme?.f2TargetHz)
        .map((p) => ({
          f1: p.phoneme!.f1TargetHz!,
          f2: p.phoneme!.f2TargetHz!,
          timestamp: p.startTimeMs ? p.startTimeMs / 1000 : 0,
          phonemeId: p.phonemeId,
          isTarget: true,
          confidence: 1.0,
        }));
      setTargetFormantPoints(targetFormants);

      // Call completion callback
      onComplete?.(result.scores.overall, result);
    },
    onError: (error) => {
      console.error('Recording error:', error);
      setIsRecording(false);
    },
  });

  // Toggle expanded view
  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Handle record button click
  const handleRecord = useCallback(() => {
    if (capturing) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [capturing, startRecording, stopRecording]);

  // Handle clear button click
  const handleClear = useCallback(() => {
    clearRecording();
    setAnalysis(null);
    setScore(null);
    setFormantPoints([]);
    setPitchPoints([]);
    setSuggestions([]);
  }, [clearRecording]);

  // Get difficulty color
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'badge-phosphor';
      case 2:
        return 'badge-amber';
      case 3:
        return 'badge-violet';
      case 4:
        return 'badge-violet';
      default:
        return 'badge-phosphor';
    }
  };

  // Get drill type label
  const getDrillTypeLabel = (drillType: string) => {
    switch (drillType) {
      case 'MINIMAL_PAIR':
        return 'Minimal Pair';
      case 'VOWEL_REDUCTION':
        return 'Vowel Reduction';
      case 'INTONATION':
        return 'Intonation';
      case 'CONSONANT_CLUSTER':
        return 'Consonant Cluster';
      case 'WORD_STRESS':
        return 'Word Stress';
      default:
        return drillType;
    }
  };

  return (
    <div
      className={`drill-card rounded-xl shadow-md border ${
        isExpanded ? 'border-[#00FF88] ring-2 ring-[#00FF88]/20' : 'border-[#27272A]'
      } transition-all duration-200`}
    >
      {/* Card header */}
      <div
        className="p-4 cursor-pointer hover:bg-[#1A1A1D] transition-colors duration-150 rounded-t-xl"
        onClick={toggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-[#F5F0E8] font-serif">{drill.title}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(drill.difficulty)}`}
              >
                Level {drill.difficulty}
              </span>
              <span className="badge-phosphor">
                {getDrillTypeLabel(drill.drillType)}
              </span>
            </div>
            <p className="text-sm lexio-mono lexio-zinc">{drill.targetIpa}</p>
            {drill.description && (
              <p className="text-sm lexio-zinc mt-1 font-serif">{drill.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {score !== null && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(score)} text-white`}
              >
                {score.toFixed(1)}%
              </span>
            )}
            <svg
              className={`w-5 h-5 lexio-zinc transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 border-t border-[#27272A]">
          {/* Recording controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleRecord}
                disabled={isRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-150 ${
                  capturing
                    ? 'bg-[#DC2626] text-white animate-pulse'
                    : 'btn-phosphor'
                }`}
              >
                {capturing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    Recording...
                  </span>
                ) : (
                  'Record'
                )}
              </button>

              {audioUrl && (
                <button
                  onClick={() => window.open(audioUrl, '_blank')}
                  className="px-4 py-3 bg-[#1A1A1D] hover:bg-[#27272A] text-[#F5F0E8] rounded-lg font-medium transition-colors duration-150 lexio-mono"
                >
                  Listen
                </button>
              )}

              {audioUrl && (
                <button
                  onClick={handleClear}
                  className="px-4 py-3 bg-[#1A1A1D] hover:bg-[#DC2626]/20 text-[#F5F0E8] rounded-lg font-medium transition-colors duration-150 lexio-mono"
                >
                  Clear
                </button>
              )}
            </div>

            {audioUrl && (
              <div className="flex items-center gap-2">
                <audio src={audioUrl} controls className="w-48" />
                <span className="text-sm lexio-zinc lexio-mono">
                  {duration.toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {/* Visualizations */}
          {showVisualization && audioUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F5F0E8] mb-2 lexio-mono">
                  Vowel Formant Chart
                </h4>
                <VowelChart
                  points={formantPoints}
                  targetPoints={targetFormantPoints}
                  width={400}
                  height={300}
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F5F0E8] mb-2 lexio-mono">
                  Pitch Contour
                </h4>
                <PitchContour
                  points={pitchPoints}
                  targetPoints={targetPitchPoints}
                  width={400}
                  height={300}
                  duration={duration}
                />
              </div>
            </div>
          )}

          {/* Score breakdown */}
          {analysis && (
            <div className="bg-[#1A1A1D] rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-[#F5F0E8] mb-3 lexio-mono">
                Score Breakdown
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs lexio-zinc mb-1 lexio-mono">Overall</div>
                  <div
                    className={`text-2xl font-bold ${getScoreColor(analysis.scores.overall)}`}
                  >
                    {analysis.scores.overall.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs lexio-zinc mb-1 lexio-mono">Pitch</div>
                  <div
                    className={`text-2xl font-bold ${getScoreColor(analysis.scores.pitchAccuracy)}`}
                  >
                    {analysis.scores.pitchAccuracy.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs lexio-zinc mb-1 lexio-mono">Timing</div>
                  <div
                    className={`text-2xl font-bold ${getScoreColor(analysis.scores.timing)}`}
                  >
                    {analysis.scores.timing.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs lexio-zinc mb-1 lexio-mono">Formant</div>
                  <div
                    className={`text-2xl font-bold ${getScoreColor(analysis.scores.formantAccuracy)}`}
                  >
                    {analysis.scores.formantAccuracy.toFixed(1)}%
                  </div>
                </div>
                {typeof analysis.scores.stressTimingAccuracy === 'number' && (
                  <div className="text-center">
                    <div className="text-xs lexio-zinc mb-1 lexio-mono">Stress Timing</div>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(analysis.scores.stressTimingAccuracy)}`}
                    >
                      {analysis.scores.stressTimingAccuracy.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Phoneme breakdown */}
              {analysis.scores.phonemeBreakdown.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-[#A1A1AA] mb-2 lexio-mono">
                    Phoneme Scores
                  </h5>
                  <div className="space-y-2">
                    {analysis.scores.phonemeBreakdown.map((phone, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-[#141416] rounded border border-[#27272A]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-[#F5F0E8]">{phone.phonemeId}</span>
                          {phone.targetF1 && phone.targetF2 && (
                            <span className="text-xs lexio-zinc">
                              Target: F1={phone.targetF1}Hz, F2={phone.targetF2}Hz
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {phone.detectedF1 && phone.detectedF2 && (
                            <span className="text-xs lexio-zinc">
                              Detected: F1={phone.detectedF1.toFixed(0)}Hz, F2={phone.detectedF2.toFixed(0)}Hz
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              phone.isAcceptable
                                ? 'badge-phosphor'
                                : 'badge-violet'
                            }`}
                          >
                            {phone.gopScore.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-[#00FF88]/5 rounded-lg p-3 border border-[#00FF88]/20">
                  <h5 className="text-xs font-semibold text-[#00FF88] mb-2 lexio-mono">
                    Suggestions
                  </h5>
                  <ul className="list-disc list-inside text-sm text-[#F5F0E8] space-y-1 font-serif">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Drill instructions */}
          <div className="bg-[#FF9500]/5 rounded-lg p-4 border border-[#FF9500]/20">
            <h4 className="text-sm font-semibold text-[#FF9500] mb-2 lexio-mono">
              Practice Tips
            </h4>
            <p className="text-sm text-[#F5F0E8] font-serif">
              {drill.description || 'Practice this drill to improve your pronunciation.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillCard;
