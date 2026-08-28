"use client";
// Phoneme mastery chart component

import React, { useMemo } from 'react';
import { UserPhonemeMastery, MasteryLevel, getMasteryLevel } from '@/types/pronunciation';

interface PhonemeMasteryChartProps {
  masteryData: UserPhonemeMastery[];
  className?: string;
}

export const PhonemeMasteryChart: React.FC<PhonemeMasteryChartProps> = ({
  masteryData,
  className = '',
}) => {
  // Group by mastery level
  const groupedData = useMemo(() => {
    const levels: Record<MasteryLevel, { count: number; phonemes: string[] }> = {
      NOVICE: { count: 0, phonemes: [] },
      BEGINNER: { count: 0, phonemes: [] },
      INTERMEDIATE: { count: 0, phonemes: [] },
      ADVANCED: { count: 0, phonemes: [] },
      MASTER: { count: 0, phonemes: [] },
    };

    for (const mastery of masteryData) {
      const level = getMasteryLevel(mastery.averageGopScore);
      levels[level].count++;
      levels[level].phonemes.push(mastery.phonemeId);
    }

    return levels;
  }, [masteryData]);

  // Get color for each level (Lexio Underground palette)
  const getLevelColor = (level: MasteryLevel): string => {
    switch (level) {
      case 'MASTER': return '#00FF88'; // phosphor
      case 'ADVANCED': return '#A855F7'; // violet
      case 'INTERMEDIATE': return '#FF9500'; // amber
      case 'BEGINNER': return '#FF9500'; // amber (lighter variant)
      case 'NOVICE': return '#DC2626'; // crimson
      default: return '#71717A'; // zinc
    }
  };

  // Get text class for each level
  const getLevelTextColor = (level: MasteryLevel): string => {
    switch (level) {
      case 'MASTER': return 'lexio-phosphor';
      case 'ADVANCED': return 'lexio-violet';
      case 'INTERMEDIATE': return 'lexio-amber';
      case 'BEGINNER': return 'lexio-amber';
      case 'NOVICE': return 'lexio-crimson';
      default: return 'lexio-zinc';
    }
  };

  // Total phonemes
  const totalPhonemes = useMemo(() => {
    return masteryData.length;
  }, [masteryData]);

  // Average mastery (based on average GOP score, not masteryLevel string)
  const averageMastery = useMemo(() => {
    if (masteryData.length === 0) return 0;
    return masteryData.reduce((sum, m) => sum + m.averageGopScore, 0) / masteryData.length;
  }, [masteryData]);

  return (
    <div className={`lexio-card rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-[#F5F0E8] mb-6 font-serif">Phoneme Mastery</h3>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A1A1D] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-[#F5F0E8] font-serif">{totalPhonemes}</div>
          <div className="text-sm lexio-zinc lexio-mono">Total Phonemes</div>
        </div>
        <div className="bg-[#1A1A1D] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold lexio-phosphor font-serif">{(averageMastery * 100).toFixed(1)}%</div>
          <div className="text-sm lexio-zinc lexio-mono">Average Mastery</div>
        </div>
        <div className="bg-[#1A1A1D] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold lexio-phosphor font-serif">{groupedData.MASTER.count}</div>
          <div className="text-sm lexio-zinc lexio-mono">Mastered</div>
        </div>
        <div className="bg-[#1A1A1D] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold lexio-crimson font-serif">{groupedData.NOVICE.count}</div>
          <div className="text-sm lexio-zinc lexio-mono">Needs Work</div>
        </div>
      </div>

      {/* Mastery distribution chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-[#F5F0E8] mb-3 lexio-mono">Mastery Distribution</h4>
        <div className="flex gap-2">
          {(['MASTER', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER', 'NOVICE'] as MasteryLevel[]).map((level) => {
            const count = groupedData[level].count;
            const percentage = totalPhonemes > 0 ? (count / totalPhonemes) * 100 : 0;
            return (
              <div
                key={level}
                className="flex-1 bg-[#1A1A1D] rounded-lg overflow-hidden"
                style={{ height: '20px' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${percentage}%`, backgroundColor: getLevelColor(level) }}
                />
                <span className="text-xs lexio-zinc px-1">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-xs lexio-zinc">
          {(['MASTER', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER', 'NOVICE'] as MasteryLevel[]).map((level) => (
            <span key={level} className={getLevelTextColor(level)}>{level}</span>
          ))}
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="space-y-4">
        {(['MASTER', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER', 'NOVICE'] as MasteryLevel[]).map((level) => {
          const data = groupedData[level];
          if (data.count === 0) return null;

          return (
            <div key={level} className="bg-[#1A1A1D] rounded-lg p-4 border-l-4" style={{ borderLeftColor: getLevelColor(level) }}>
              <h4 className={`font-semibold mb-2 ${getLevelTextColor(level)} font-serif`}>
                {level} ({data.count} phonemes)
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.phonemes.slice(0, 10).map((phoneme, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-[#141416] rounded text-xs font-mono text-[#F5F0E8] border border-[#27272A]"
                  >
                    {phoneme}
                  </span>
                ))}
                {data.phonemes.length > 10 && (
                  <span className="px-2 py-1 bg-[#141416] rounded text-xs lexio-zinc border border-[#27272A]">
                    +{data.phonemes.length - 10} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhonemeMasteryChart;
