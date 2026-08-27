// Vowel chart visualization for formant analysis

import React, { useRef, useEffect, useMemo } from 'react';
import { FormantPoint, VowelChartConfig } from '@/types/pronunciation';

interface VowelChartProps {
  points: FormantPoint[];
  targetPoints?: FormantPoint[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
}

const DEFAULT_CONFIG: VowelChartConfig = {
  f1Range: [200, 1000],
  f2Range: [500, 2500],
  vowelCategories: {
    high_front: {
      label: 'High Front',
      color: 'text-red-500',
      f1Range: [200, 400],
      f2Range: [1800, 2500],
    },
    mid_front: {
      label: 'Mid Front',
      color: 'text-orange-500',
      f1Range: [400, 600],
      f2Range: [1500, 2000],
    },
    low_front: {
      label: 'Low Front',
      color: 'text-yellow-500',
      f1Range: [600, 800],
      f2Range: [1500, 2000],
    },
    high_back: {
      label: 'High Back',
      color: 'text-purple-500',
      f1Range: [200, 400],
      f2Range: [500, 1200],
    },
    mid_back: {
      label: 'Mid Back',
      color: 'text-indigo-500',
      f1Range: [400, 600],
      f2Range: [800, 1500],
    },
    low_back: {
      label: 'Low Back',
      color: 'text-pink-500',
      f1Range: [600, 800],
      f2Range: [800, 1500],
    },
    central: {
      label: 'Central',
      color: 'text-green-500',
      f1Range: [400, 600],
      f2Range: [1000, 1800],
    },
  },
};

// Vowel targets for reference
const VOWEL_TARGETS: Record<string, { f1: number; f2: number; label: string }> = {
  'i:': { f1: 270, f2: 2290, label: '/iː/' },
  'I': { f1: 390, f2: 1990, label: '/ɪ/' },
  'e': { f1: 530, f2: 1840, label: '/ɛ/' },
  'ae': { f1: 660, f2: 1720, label: '/æ/' },
  'uh': { f1: 600, f2: 1170, label: '/ʌ/' },
  '@': { f1: 500, f2: 1500, label: '/ə/' },
  'ɔ:': { f1: 500, f2: 850, label: '/ɔː/' },
  'o:': { f1: 450, f2: 850, label: '/oː/' },
  'u:': { f1: 300, f2: 870, label: '/uː/' },
  'ʊ': { f1: 440, f2: 1020, label: '/ʊ/' },
  'ɑ:': { f1: 750, f2: 1100, label: '/ɑː/' },
  'ɜ:': { f1: 490, f2: 1350, label: '/ɜː/' },
};

export const VowelChart: React.FC<VowelChartProps> = ({
  points,
  targetPoints,
  width = 600,
  height = 400,
  showGrid = true,
  showLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = useMemo(() => DEFAULT_CONFIG, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    canvas.width = width;
    canvas.height = height;

    // Padding
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Scale factors
    const f1Min = config.f1Range[0];
    const f1Max = config.f1Range[1];
    const f2Min = config.f2Range[0];
    const f2Max = config.f2Range[1];

    const xScale = chartWidth / (f2Max - f2Min);
    const yScale = chartHeight / (f1Max - f1Min);

    // Transform: F1 is vertical (higher = lower in chart), F2 is horizontal
    const toX = (f2: number) => padding + (f2 - f2Min) * xScale;
    const toY = (f1: number) => padding + chartHeight - (f1 - f1Min) * yScale;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      // Vertical grid lines (F2)
      for (let f2 = f2Min; f2 <= f2Max; f2 += 200) {
        const x = toX(f2);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();

        if (showLabels) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${f2}`, x, padding + chartHeight + 15);
        }
      }

      // Horizontal grid lines (F1)
      for (let f1 = f1Min; f1 <= f1Max; f1 += 100) {
        const y = toY(f1);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();

        if (showLabels) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${f1}`, padding - 10, y + 3);
        }
      }
    }

    // Draw vowel category regions
    for (const [category, categoryConfig] of Object.entries(config.vowelCategories)) {
      const x1 = toX(categoryConfig.f2Range[0]);
      const x2 = toX(categoryConfig.f2Range[1]);
      const y1 = toY(categoryConfig.f1Range[1]); // Inverted
      const y2 = toY(categoryConfig.f1Range[0]);

      ctx.fillStyle = categoryConfig.color.replace('text', 'bg') + '20';
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

      ctx.strokeStyle = categoryConfig.color.replace('text', 'border') + '40';
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      if (showLabels) {
        ctx.fillStyle = categoryConfig.color.replace('text', '') + '80';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(categoryConfig.label, (x1 + x2) / 2, (y1 + y2) / 2);
      }
    }

    // Draw target vowel positions
    for (const [phonemeId, target] of Object.entries(VOWEL_TARGETS)) {
      const x = toX(target.f2);
      const y = toY(target.f1);

      // Draw target marker
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(target.label, x, y - 15);
    }

    // Draw target points (if provided)
    if (targetPoints && targetPoints.length > 0) {
      ctx.fillStyle = '#10b981';
      for (const point of targetPoints) {
        const x = toX(point.f2);
        const y = toY(point.f1);

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw label if phoneme is known
        if (point.phonemeId && VOWEL_TARGETS[point.phonemeId]) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(VOWEL_TARGETS[point.phonemeId].label, x, y - 12);
        }
      }
    }

    // Draw user points
    if (points && points.length > 0) {
      ctx.fillStyle = '#ef4444';
      for (const point of points) {
        const x = toX(point.f2);
        const y = toY(point.f1);

        // Size based on confidence
        const size = 4 + point.confidence * 6;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw label if phoneme is known
        if (point.phonemeId && VOWEL_TARGETS[point.phonemeId]) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(VOWEL_TARGETS[point.phonemeId].label, x, y + 15);
        }
      }

      // Draw trajectory line
      if (points.length > 1) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(points[0].f2), toY(points[0].f1));
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(toX(points[i].f2), toY(points[i].f1));
        }
        ctx.stroke();
      }
    }

    // Draw axes labels
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('F2 (Hz) →', padding + chartWidth / 2, padding - 20);
    
    ctx.save();
    ctx.translate(20, padding + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('F1 (Hz) →', 0, 0);
    ctx.restore();

    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Vowel Formant Chart', width / 2, 20);
  }, [points, targetPoints, width, height, showGrid, showLabels, config]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto"
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>Red: Your pronunciation | Blue: Target vowels | Green: Target for this drill</p>
      </div>
    </div>
  );
};

export default VowelChart;
