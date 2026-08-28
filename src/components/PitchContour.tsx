"use client";
// Pitch contour visualization

import React, { useRef, useEffect } from 'react';
import { PitchPoint } from '@/types/pronunciation';

interface PitchContourProps {
  points: PitchPoint[];
  targetPoints?: PitchPoint[];
  width?: number;
  height?: number;
  duration?: number; // in seconds
  showGrid?: boolean;
}

export const PitchContour: React.FC<PitchContourProps> = ({
  points,
  targetPoints,
  width = 600,
  height = 200,
  duration = 2,
  showGrid = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Scale factors
    const maxFrequency = 500; // Hz (typical for speech)
    const minFrequency = 50; // Hz

    const xScale = chartWidth / duration;
    const yScale = chartHeight / (maxFrequency - minFrequency);

    // Transform functions
    const toX = (time: number) => padding.left + time * xScale;
    const toY = (freq: number) => padding.top + chartHeight - (freq - minFrequency) * yScale;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1;

      // Vertical grid lines (time)
      const timeInterval = Math.max(0.2, duration / 10);
      for (let t = 0; t <= duration; t += timeInterval) {
        const x = toX(t);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();

        ctx.fillStyle = '#71717A';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.toFixed(1)}s`, x, padding.top + chartHeight + 15);
      }

      // Horizontal grid lines (frequency)
      for (let freq = minFrequency; freq <= maxFrequency; freq += 50) {
        const y = toY(freq);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        ctx.fillStyle = '#71717A';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${freq}Hz`, padding.left - 10, y + 3);
      }
    }

    // Draw target contour (if provided)
    if (targetPoints && targetPoints.length > 0) {
      ctx.strokeStyle = '#FF9500';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      let first = true;
      for (const point of targetPoints) {
        const x = toX(point.timestamp);
        const y = toY(point.frequency);
        
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw target points
      ctx.fillStyle = '#FF9500';
      for (const point of targetPoints) {
        const x = toX(point.timestamp);
        const y = toY(point.frequency);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw user contour
    if (points && points.length > 0) {
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let first = true;
      for (const point of points) {
        const x = toX(point.timestamp);
        const y = toY(point.frequency);
        
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw user points
      ctx.fillStyle = '#DC2626';
      for (const point of points) {
        const x = toX(point.timestamp);
        const y = toY(point.frequency);
        
        // Size based on confidence
        const size = 2 + (point.confidence ?? 0) * 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw axes labels
    ctx.fillStyle = '#F5F0E8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Time →', padding.left + chartWidth / 2, padding.top - 10);
    
    ctx.save();
    ctx.translate(25, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency (Hz) →', 0, 0);
    ctx.restore();

    // Draw title
    ctx.fillStyle = '#F5F0E8';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pitch Contour', width / 2, 15);
  }, [points, targetPoints, width, height, duration, showGrid]);

  return (
    <div className="lexio-card rounded-lg shadow-lg p-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto"
      />
      <div className="mt-2 text-xs lexio-zinc text-center lexio-mono">
        <p><span className="lexio-crimson">Red</span>: Your pitch | <span className="lexio-amber">Amber</span>: Target contour (dashed)</p>
      </div>
    </div>
  );
};

export default PitchContour;
