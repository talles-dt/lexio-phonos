// Phoneme mastery chart component

import React, { useMemo } from 'react';
import { UserPhonemeMastery, MasteryLevel, MASTERY_THRESHOLDS, getMasteryLevel } from '@/types/pronunciation';

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
      const level = getMasteryLevel(mastery.masteryLevel);
      levels[level].count++;
      levels[level].phonemes.push(mastery.phoneme.ipaSymbol);
    }

    return levels;
  }, [masteryData]);

  // Get color for each level
  const getLevelColor = (level: MasteryLevel) => {
    switch (level) {
      case 'MASTER': return 'bg-green-500';
      case 'ADVANCED': return 'bg-blue-500';
      case 'INTERMEDIATE': return 'bg-yellow-500';
      case 'BEGINNER': return 'bg-orange-500';
      case 'NOVICE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get text color for each level
  const getLevelTextColor = (level: MasteryLevel) => {
    switch (level) {
      case 'MASTER': return 'text-green-700';
      case 'ADVANCED': return 'text-blue-700';
      case 'INTERMEDIATE': return 'text-yellow-700';
      case 'BEGINNER': return 'text-orange-700';
      case 'NOVICE': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  // Total phonemes
  const totalPhonemes = useMemo(() => {
    return masteryData.length;
  }, [masteryData]);

  // Average mastery
  const averageMastery = useMemo(() => {
    if (masteryData.length === 0) return 0;
    return masteryData.reduce((sum, m) => sum + m.masteryLevel, 0) / masteryData.length;
  }, [masteryData]);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Phoneme Mastery</h3>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalPhonemes}</div>
          <div className="text-sm text-gray-500">Total Phonemes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{(averageMastery * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-500">Average Mastery</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{groupedData.MASTER.count}</div>
          <div className="text-sm text-gray-500">Mastered</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{groupedData.NOVICE.count}</div>
          <div className="text-sm text-gray-500">Needs Work</div>
        </div>
      </div>

      {/* Mastery distribution chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Mastery Distribution</h4>
        <div className="flex gap-2">
          {(['MASTER', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER', 'NOVICE'] as MasteryLevel[]).map((level) => {
            const count = groupedData[level].count;
            const percentage = totalPhonemes > 0 ? (count / totalPhonemes) * 100 : 0;
            return (
              <div 
                key={level}
                className="flex-1 bg-gray-100 rounded-lg overflow-hidden"
                style={{ height: '20px' }}
              >
                <div
                  className={`h-full ${getLevelColor(level)} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
                <span className="text-xs text-gray-600 px-1">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
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
            <div key={level} className={`bg-${getLevelColor(level).replace('bg-', '').replace('-500', '-50')} rounded-lg p-4`}>
              <h4 className={`font-semibold mb-2 ${getLevelTextColor(level)}`}>
                {level} ({data.count} phonemes)
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.phonemes.slice(0, 10).map((phoneme, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-white rounded text-xs font-mono"
                  >
                    {phoneme}
                  </span>
                ))}
                {data.phonemes.length > 10 && (
                  <span className="px-2 py-1 bg-white rounded text-xs text-gray-500">
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
