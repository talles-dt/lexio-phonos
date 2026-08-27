// Drill card component for pronunciation practice

import React, { useState, useCallback } from 'react';
import { Drill, PhonemeScore, getScoreColor, getMasteryLevel, MasteryLevel } from '@/types/pronunciation';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { VowelChart } from './VowelChart';
import { PitchContour } from './PitchContour';
import { FormantPoint, PitchPoint } from '@/types/pronunciation';
import { analyzeDrill, extractFormantsFromAudio, extractPitchContour } from '@/utils/scoring';
import { DrillAnalysis } from '@/types/pronunciation';

interface DrillCardProps {
  drill: Drill & { phonemeSequence: any[] };
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
      
      // Analyze the recording
      const result = analyzeDrill(
        drill.id,
        drill.targetText,
        drill.targetIpa,
        drill.phonemeSequence,
        audioData.samples,
        audioData.sampleRate
      );

      setAnalysis(result);
      setScore(result.scores.overall);
      setSuggestions(result.scores.suggestions);

      // Extract visualization data
      const formants = extractFormantsFromAudio(audioData.samples, audioData.sampleRate);
      const formantPoints: FormantPoint[] = formants.map(f => ({
        f1: f.f1,
        f2: f.f2,
        timestamp: f.timestamp,
        phonemeId: null,
        isTarget: false,
        confidence: f.confidence,
      }));
      setFormantPoints(formantPoints);

      const pitches = extractPitchContour(audioData.samples, audioData.sampleRate);
      const pitchPoints: PitchPoint[] = pitches.map(p => ({
        frequency: p.frequency,
        timestamp: p.timestamp,
        isTarget: false,
        confidence: p.confidence,
      }));
      setPitchPoints(pitchPoints);

      // Set target points from phoneme sequence
      const targetFormants: FormantPoint[] = drill.phonemeSequence
        .filter(p => p.phoneme?.f1TargetHz && p.phoneme?.f2TargetHz)
        .map(p => ({
          f1: p.phoneme.f1TargetHz!,
          f2: p.phoneme.f2TargetHz!,
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
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get drill type label
  const getDrillTypeLabel = (drillType: string) => {
    switch (drillType) {
      case 'MINIMAL_PAIR': return 'Minimal Pair';
      case 'VOWEL_REDUCTION': return 'Vowel Reduction';
      case 'INTONATION': return 'Intonation';
      case 'CONSONANT_CLUSTER': return 'Consonant Cluster';
      case 'WORD_STRESS': return 'Word Stress';
      default: return drillType;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border ${isExpanded ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} transition-all duration-200`}>
      {/* Card header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
        onClick={toggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{drill.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(drill.difficulty)}`}>
                Level {drill.difficulty}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getDrillTypeLabel(drill.drillType)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{drill.targetIpa}</p>
            {drill.description && (
              <p className="text-sm text-gray-500 mt-1">{drill.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {score !== null && (
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(score)} text-white`}>
                {score.toFixed(1)}%
              </span>
            )}
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* Recording controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleRecord}
                disabled={isRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-150 ${
                  capturing 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-150"
                >
                  Listen
                </button>
              )}

              {audioUrl && (
                <button
                  onClick={handleClear}
                  className="px-4 py-3 bg-gray-100 hover:bg-red-100 text-gray-600 rounded-lg font-medium transition-colors duration-150"
                >
                  Clear
                </button>
              )}
            </div>

            {audioUrl && (
              <div className="flex items-center gap-2">
                <audio src={audioUrl} controls className="w-48" />
                <span className="text-sm text-gray-500">
                  {duration.toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {/* Visualizations */}
          {showVisualization && audioUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Vowel Formant Chart</h4>
                <VowelChart
                  points={formantPoints}
                  targetPoints={targetFormantPoints}
                  width={400}
                  height={300}
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Pitch Contour</h4>
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
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Overall</div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.overall)}`}>
                    {analysis.scores.overall.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Pitch</div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.pitchAccuracy)}`}>
                    {analysis.scores.pitchAccuracy.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Timing</div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.timing)}`}>
                    {analysis.scores.timing.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Formant</div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.formantAccuracy)}`}>
                    {analysis.scores.formantAccuracy.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Phoneme breakdown */}
              {analysis.scores.phonemeBreakdown.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-gray-600 mb-2">Phoneme Scores</h5>
                  <div className="space-y-2">
                    {analysis.scores.phonemeBreakdown.map((phone, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{phone.phonemeId}</span>
                          {phone.targetF1 && phone.targetF2 && (
                            <span className="text-xs text-gray-500">
                              Target: F1={phone.targetF1}Hz, F2={phone.targetF2}Hz
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {phone.detectedF1 && phone.detectedF2 && (
                            <span className="text-xs text-gray-500">
                              Detected: F1={phone.detectedF1.toFixed(0)}Hz, F2={phone.detectedF2.toFixed(0)}Hz
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            phone.isAcceptable 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
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
                <div className="bg-blue-50 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-blue-700 mb-2">Suggestions</h5>
                  <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Drill instructions */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-700 mb-2">Practice Tips</h4>
            <p className="text-sm text-yellow-800">{drill.description || 'Practice this drill to improve your pronunciation.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillCard;
